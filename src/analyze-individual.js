// ============================================================
// PRISM v2.0 — Individual Article Analysis (Haiku per article)
// Pass 1 of multi-pass analysis: cheap, parallelizable, structured.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { MODELS, LIMITS } from './config.js';

const client = new Anthropic();

const INDIVIDUAL_PROMPT = `You are PRISM's article analyst. Analyze this single article and extract structured data.

CRITICAL RULES:
- Only state what the article ACTUALLY says. Never infer, speculate, or add information not present.
- If the article is vague or low-quality, say so. A short honest analysis beats a long hallucinated one.
- URLs must come directly from the article text. Never invent URLs.

HUMAN SIGNAL DETECTION:
You must assess whether this article was written by a human with real expertise, or is likely AI-generated content farming (slop). Consider:
- Does the author have a name, track record, or clear identity?
- Does the article contain original insight, opinion, or experience — or is it a generic summary?
- Does it reference specific conversations, events, or people in a way that shows the author was present?
- Is it from a known human-curated source (personal blog, established newsletter, conference talk)?
Rate as: "human_authored" (clear human voice/expertise), "human_curated" (aggregator but curated by a known person), "uncertain" (can't tell), "likely_slop" (generic, no voice, reads like AI filler).

Respond with ONLY valid JSON (no markdown fencing):
{
  "summary": "2-3 sentence factual summary",
  "key_claims": ["claim 1", "claim 2"],
  "tools_mentioned": [{"name": "string", "url": "string or null", "what_it_does": "string"}],
  "relevance_to_julien": "one sentence (Julien is a non-coding founder in Brussels building AI tools for his food shop and personal projects)",
  "novelty": "new|update|recurring",
  "category_tags": ["tag1", "tag2"],
  "human_signal": "human_authored|human_curated|uncertain|likely_slop",
  "human_signal_reason": "one sentence explaining the assessment",
  "conversation_value": "high|medium|low — would someone at the frontier be expected to have read this?"
}`;

export default async function analyzeIndividual(articles) {
  console.log(`\n🔍 INDIVIDUAL ANALYSIS: ${articles.length} articles with ${MODELS.scorer}...`);

  let totalInput = 0;
  let totalOutput = 0;
  const BATCH_SIZE = 10; // Process 10 concurrently

  const results = [];

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(articles.length / BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches}...`);

    const batchResults = await Promise.allSettled(
      batch.map(async (article) => {
        const content = article.fullTextAvailable && article.fullText
          ? article.fullText
          : (article.content || '');

        const articleBlock = `TITLE: ${article.title}
SOURCE: ${article.source}
URL: ${article.link}
DATE: ${article.date}
CATEGORY: ${article.category || 'unknown'}

CONTENT:
${content.substring(0, LIMITS.maxArticleLength)}`;

        try {
          const response = await client.messages.create({
            model: MODELS.scorer, // Haiku — cheap
            max_tokens: 512,
            messages: [{ role: 'user', content: `${INDIVIDUAL_PROMPT}\n\n${articleBlock}` }],
          });

          totalInput += response.usage.input_tokens;
          totalOutput += response.usage.output_tokens;

          const text = response.content[0].text.trim();
          try {
            const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
            return { ...article, analysis: parsed };
          } catch {
            console.log(`    ⚠️ Parse failed for: ${article.title.substring(0, 50)}`);
            return {
              ...article,
              analysis: {
                summary: text.substring(0, 300),
                key_claims: [],
                tools_mentioned: [],
                relevance_to_julien: 'Parse failed',
                novelty: 'unknown',
                category_tags: [],
                human_signal: 'uncertain',
                human_signal_reason: 'Analysis parse failed',
                conversation_value: 'low',
              },
            };
          }
        } catch (err) {
          console.log(`    ⚠️ API error for: ${article.title.substring(0, 50)} — ${err.message}`);
          return {
            ...article,
            analysis: {
              summary: 'Analysis failed due to API error',
              key_claims: [],
              tools_mentioned: [],
              relevance_to_julien: 'Unknown',
              novelty: 'unknown',
              category_tags: [],
              human_signal: 'uncertain',
              human_signal_reason: 'API error during analysis',
              conversation_value: 'low',
            },
          };
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  console.log(`  ✅ Individual analysis complete: ${results.length} articles`);
  console.log(`  Tokens: ${totalInput.toLocaleString()} in / ${totalOutput.toLocaleString()} out`);

  return { articles: results, tokens: { input: totalInput, output: totalOutput } };
}
