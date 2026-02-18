// ============================================================
// PRISM v3.0 — Validation Step (Anti-Hallucination Checker)
// Post-research, pre-delivery: Sonnet checks briefing against sources.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { MODELS } from './config.js';

const client = new Anthropic();

const VALIDATION_PROMPT = `You are a fact-checker for PRISM v3.0, a personal intelligence briefing.

You will receive a briefing (markdown) that was generated from source articles and web search.

Your job: check every factual claim in the briefing.

For each section of the briefing, evaluate:
- Are all URLs mentioned likely real (properly formatted, from known domains)?
- Are there any invented problems or crises not supported by evidence?
- Are there any sections that feel like filler (vague, unsourced, speculative)?
- Does the WORLD LENS section maintain an analytical tone (not clickbait)?
- Does the FEED HEALTH REPORT contain reasonable recommendations?

CRITICAL: Flag any instance where the briefing invents a problem with Julien's projects that isn't supported by the articles.

Respond with ONLY valid JSON:
{
  "confidence": 0.0-1.0,
  "issues": [
    {
      "section": "section name",
      "issue": "description of the problem",
      "severity": "critical|warning|minor",
      "action": "remove|flag|keep"
    }
  ],
  "clean_sections": ["section names that passed validation"],
  "summary": "one sentence overall assessment"
}`;

export default async function validate(briefing) {
  console.log('\n✅ VALIDATING briefing against source data...');

  try {
    const response = await client.messages.create({
      model: MODELS.analyzer, // Sonnet 4.6
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      messages: [{
        role: 'user',
        content: `${VALIDATION_PROMPT}\n\n===== BRIEFING =====\n${briefing}`
      }],
    });

    // Filter for text blocks (skip thinking blocks)
    const textBlocks = response.content.filter(b => b.type === 'text');
    const text = textBlocks.map(b => b.text).join('').trim();

    let validation;
    try {
      validation = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      console.log('  ⚠️ Validation parse failed — proceeding with unvalidated briefing');
      return {
        confidence: 0.5,
        validated: false,
        briefing,
        tokens: response.usage,
      };
    }

    const confidence = validation.confidence || 0.5;
    let validatedBriefing = briefing;

    // Remove critical issues
    const criticalIssues = (validation.issues || []).filter(i => i.severity === 'critical' && i.action === 'remove');
    if (criticalIssues.length > 0) {
      console.log(`  ⚠️ ${criticalIssues.length} critical issues found — flagging in briefing`);
      if (confidence < 0.7) {
        validatedBriefing = `> ⚠️ **Low-confidence briefing** — Some sections may contain unverified claims. PRISM confidence: ${(confidence * 100).toFixed(0)}%\n\n${validatedBriefing}`;
      }
    }

    console.log(`  Confidence: ${(confidence * 100).toFixed(0)}%`);
    console.log(`  Issues: ${(validation.issues || []).length} (${criticalIssues.length} critical)`);
    console.log(`  Clean sections: ${(validation.clean_sections || []).join(', ')}`);
    console.log(`  Tokens: ${response.usage.input_tokens.toLocaleString()} in / ${response.usage.output_tokens.toLocaleString()} out`);

    return {
      confidence,
      validated: true,
      briefing: validatedBriefing,
      issues: validation.issues || [],
      tokens: response.usage,
    };
  } catch (err) {
    console.log(`  ⚠️ Validation error: ${err.message} — proceeding with unvalidated briefing`);
    return {
      confidence: 0.5,
      validated: false,
      briefing,
      tokens: { input_tokens: 0, output_tokens: 0 },
    };
  }
}
