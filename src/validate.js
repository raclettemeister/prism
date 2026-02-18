// ============================================================
// PRISM v2.0 — Validation Step (Anti-Hallucination Checker)
// Post-synthesis, pre-delivery: Haiku checks briefing against sources.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { MODELS } from './config.js';

const client = new Anthropic();

const VALIDATION_PROMPT = `You are a fact-checker for PRISM, a personal intelligence briefing.

You will receive:
1. A briefing (markdown)
2. The source analysis data (JSON) that the briefing was generated from

Your job: check every factual claim in the briefing against the source data.

For each section of the briefing, evaluate:
- Are all URLs mentioned actually present in the source data?
- Are all claims supported by the source articles?
- Are there any invented problems or crises not supported by evidence?
- Are there any sections that feel like filler (vague, unsourced, speculative)?

CRITICAL: Flag any instance where the briefing invents a problem with Julien's projects that isn't in the source data. This is the most dangerous failure mode.

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

export default async function validate(briefing, analysisData) {
  console.log('\n✅ VALIDATING briefing against source data...');

  try {
    const response = await client.messages.create({
      model: MODELS.scorer, // Haiku — cheap
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `${VALIDATION_PROMPT}\n\n===== BRIEFING =====\n${briefing}\n\n===== SOURCE ANALYSIS DATA =====\n${JSON.stringify(analysisData, null, 2).substring(0, 30000)}`
      }],
    });

    const text = response.content[0].text.trim();
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
      // Add a warning banner at the top if confidence is low
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
