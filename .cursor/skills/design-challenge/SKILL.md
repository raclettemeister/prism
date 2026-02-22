---
name: design-challenge
description: After a brainstorm or design is produced, before writing the implementation plan, challenges the design with three questions (what could go wrong, what's simpler, what's missing). Use when the user has just finished brainstorming or has a draft design and before creating the plan or implementing.
---

# Design Challenge

## When to use

**After** brainstorming or design is on the table. **Before** the implementation plan or any code.

Do not skip this step. "Looks good" on first pass is not enough — push for at least one round of challenge.

## The three questions

Present these explicitly and address each in turn (or ask the user to respond):

1. **What could go wrong?** — Failure modes, edge cases, assumptions that might break, dependencies that could block.
2. **What's simpler?** — Can we remove scope, defer parts, or get the same outcome with less?
3. **What's missing?** — Gaps in the design, unclear boundaries, things the design doesn't yet decide.

## How to run it

1. Restate the design or point to the design doc in one short paragraph.
2. Work through each question: either you propose answers and ask the user to confirm or correct, or you ask the user to answer and you synthesize.
3. If the challenge surfaces changes: update the design (or design doc) and, if substantial, run the three questions again on the revised design.
4. **Only after** the user has considered these (and any revisions are captured) proceed to the implementation plan (e.g. writing-plans skill) or to "implement" if they explicitly request it.

## Rules

- One round minimum. Do not accept "skip it" or "no time" without the user explicitly saying so.
- If the user says "looks good" or "sounds good" on the design, respond with: "Before we plan: what could go wrong? What's simpler? What's missing?" and wait for at least brief answers.
- Do not write the plan or any code until this step is done.
