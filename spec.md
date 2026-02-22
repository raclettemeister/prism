# PRISM — Product Spec

**Personal Research Intelligence System.** An overnight AI analyst that reads ~110 RSS feeds and delivers a structured intelligence briefing every morning (email + live HTML portal).

See [README.md](README.md) for what it does day-to-day and [ARCHITECTURE.md](ARCHITECTURE.md) for the technical pipeline.

---

## Feedback: Purpose and Evolution

Feedback in PRISM is **not only** for tuning the next briefing (source ratings, section preferences). Its primary purpose is to drive **PRISM software iterations**.

### Feedback as iteration tool (current)

- **Purpose:** Feedback is the input for **improving PRISM the product.** When you change the software version, you use feedback — from the HTML portal or elsewhere — to decide what to change and what to build next.
- **Invocable during development:** The feedback flow is intended to be used while modifying the software: you react to briefings, rate sections, leave notes; that input guides the next iteration of prompts, logic, sections, sources, and features.
- **Mechanics:** The HTML portal submits structured feedback (article reactions, section ratings, freeform notes) to a Cloudflare Worker, which writes `data/feedback-latest.json` into the repo. The next run reads it, injects it into synthesis prompts, and updates `data/memory.json`. That same data is the **source of truth for iteration**: human reads feedback and updates code/config accordingly.

### Feedback for auto-iteration (future)

- **Goal:** Interacting with PRISM on feedback (e.g. in the portal or in conversation) should eventually allow PRISM to **auto-iterate** — to improve itself from feedback without you editing code by hand.
- **Direction:** A future component could consume feedback and produce concrete changes: prompt tweaks, config updates, section weighting, source tier changes, or code changes. Closing that loop would make feedback the primary driver of self-improvement.

### Summary

| Horizon   | Role of feedback |
|----------|-------------------|
| **Now**  | Iteration tool: you use feedback to decide how to improve PRISM (invocable during software changes). |
| **Later**| Auto-iteration: PRISM uses feedback to improve itself (prompts, logic, behaviour) with minimal or no manual code edits. |

**Current work (2026-02-22):** Iteration-feedback design and partial implementation (tool feedback, planning gate); full handoff and "next session verify" checklist are in [docs/plans/2026-02-22-iteration-feedback-design.md](docs/plans/2026-02-22-iteration-feedback-design.md).

The pipeline must reliably **ingest** feedback (Worker + optional MylifeOS fallback) and **use** it in runs; from there, iteration is human-driven, with a path to machine-driven improvement.
