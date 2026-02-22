# PRISM iteration feedback — design

**Date:** 2026-02-22  
**Goal:** Make PRISM "alive" — talk to it via the HTML portal with behavior-change requests and rich contextual feedback. All feedback is written to a dedicated folder so you can pull from it in Cursor and run brainstorm → plan → implementation. No auto-fix: the folder is input for human/Cursor iteration.

---

## Implementation status (session handoff)

**2026-02-22:** This session was intended as **planning only**. Implementation was started by accident (before design approval and before an implementation plan).

**Already implemented (to be verified next session):**
- Per-tool feedback in TOOLS TO TRY: extract tools from markdown, inject widgets (heart / like / down), state and payload `tools: [{ name, rating }]`, synthesis uses tool ratings in feedback text.
- Project rule: `.cursor/rules/planning-session-gate.mdc` — planning sessions stay planning-only until design approved and user explicitly requests implementation.

**Not yet implemented (design only):**
- Section feedback with snippet + optional text (section bodies extraction, widget placement after content).
- Article feedback with snippet + canned "Feed provided no news" / "Feed looks broken" + optional text.
- "How should PRISM change?" iteration-request textarea and payload field.
- Worker: write `docs/iteration-requests/YYYY-MM-DD-HHmmss.md` with full context when iteration request or contextual feedback present.
- Rich payload shape: sections as array of { id, label, snippet, rating, note }; mustReads with snippet, feedProvidedNoNews, feedLooksBroken, note.

**Next session:** Verify the implemented parts against this design and the codebase; then either complete the remaining items via a proper implementation plan or adjust the design and plan from here.

---

## 1. Principles

- **Contextual feedback in multiple spots** — Feedback widgets live next to the content they refer to (after THE SIGNAL, after each section, after each must-read article), not only in one global panel.
- **Every feedback item carries context for Cursor** — Topic (section or article), **what was written** (snippet of that section/article), rating, optional note. So when Cursor reads the iteration folder it has full context.
- **Canned options where they fit** — For articles: "This feed didn't provide any news", "This feed looks broken" (features already present in the briefing). Emoji + optional text everywhere.
- **One rich file per submission** — Worker writes one Markdown file per submit to `docs/iteration-requests/` with all contextual feedback + iteration request, so one Cursor session can work through the whole day's feedback.

---

## 2. HTML structure — multiple feedback spots

### 2.1 Section feedback (THE SIGNAL and every other section)

**Placement:** Immediately after the section's content block (after the `<h2>` and the paragraph/list content), before the next `<h2>`.

**Per section:**
- **Topic label:** e.g. "THE SIGNAL", "BUILDER INTELLIGENCE" (already available from section id/label).
- **What was written:** The body of that section (between this `##` and the next `##`) — truncated to a reasonable length (e.g. 800 chars) for the payload and for the written file. Stored in a `data-*` attribute or in a JS structure keyed by section id so the widget can send it on submit.
- **Rating:** Quick buttons with **labels** (not just emoji), and **optional text input** next to it.
  - For **THE SIGNAL:** e.g. "👍 Great signal today" / "👎 Bad signal today" (or "✓ OK") + one optional text field: "Add more (optional):".
  - For **other sections:** e.g. "👍 Useful" / "👎 Not useful" (or "✓ OK") + optional text.
- **Payload:** `sectionId`, `sectionLabel`, `snippet` (what was written), `rating`, `note` (optional text).

**Implementation note:** Section bodies must be extracted from the briefing markdown in `page.js` (regex per section header, content until next `##`). Pass `sectionsWithSnippets` into the HTML/JS so each widget has access to its snippet and can include it in the submit payload.

### 2.2 Article feedback (must-read list)

**Placement:** After each must-read item (current behavior), but with more UI.

**Per article:**
- **Topic:** Article title + source (already have).
- **What was written:** Snippet from the briefing for this article — e.g. the "Why read it:" and "Conversation value:" lines (or first 300 chars of that entry). Extract when building the page from the markdown.
- **Rating:** Keep ❤️ Love / ✓ OK / ✗ Skip.
- **Canned options (new):** Two checkboxes or buttons, clearly labeled:
  - "This feed didn't provide any news"
  - "This feed looks broken"
  (Only one or both can be set; they're optional.)
- **Optional text:** Short "Add more (optional):" next to the article widget.
- **Payload:** `title`, `source`, `snippet`, `rating`, `feedProvidedNoNews`: boolean, `feedLooksBroken`: boolean, `note`: string.

### 2.3 Global panel (bottom of page)

- **Overall rating:** 1–5 stars (unchanged).
- **Notes for PRISM (optional):** Freeform, for nightly run context (unchanged).
- **How should PRISM change?** — Dedicated textarea + "Send iteration request" (or include in one submit). This is the explicit behavior-change request ("never show EU industry policies", "remove this newsletter", "less tools more articles"). Sent as `iterationRequest` in the payload.

**Submit behavior:** One "Submit feedback" button that sends the full payload: all section feedback (with snippets), all article feedback (with snippets + canned flags), overall rating, notes, and iteration request. Worker then writes one file to `docs/iteration-requests/` with full context.

---

## 3. Data written to the repo

### 3.1 Existing `data/feedback-latest.json` (unchanged for nightly run)

Still written when payload has the usual shape (date, briefingRating, mustReads, sections, openNotes). Used by the next nightly run for prompts and memory. Can be extended to include the new fields (section notes, article canned reasons) so synthesis can read them; optional for v1.

### 3.2 New: `docs/iteration-requests/YYYY-MM-DD-HHmmss.md`

**When:** Written on every submit that contains at least one of: section feedback with a note or non-OK rating, article feedback with canned option or note, or a non-empty `iterationRequest`.

**Content (Markdown, Cursor-friendly):** One file per submit. Structure:

```markdown
# PRISM feedback — 2026-02-22 14:32
**Submitted:** 2026-02-22T14:32:00Z
**Briefing date:** 2026-02-22

---

## Section feedback

### 🔴 THE SIGNAL
- **Rating:** 👎 Bad signal today
- **Your note:** I don't want EU industry policy (batteries, cars) in the briefing at all. Add a hard rule.
- **What was written:**
> The EU agreed new rules on battery requirements for electric vehicles...

### 🧱 BUILDER INTELLIGENCE
- **Rating:** 👍 Useful
- **Your note:** (none)
- **What was written:**
> **Methodology beat:** Gabriel Chua confirms...

---

## Article feedback

### "How I think about Codex" (simonwillison.net)
- **Rating:** ✓ OK
- **Feed didn't provide any news:** yes
- **Feed looks broken:** no
- **Your note:** This was a repost, not new.
- **What was written:**
> Why read it: Gabriel Chua (OpenAI Developer Experience) breaks down...

---

## How should PRISM change?
Never show EU industry policies in the briefing. Remove newsletter X. I need less tools section but more articles.
```

So Cursor sees: **topic** + **what was written** + **rating/canned** + **your note** for every item, plus the freeform iteration request.

---

## 4. Worker changes

- **Same endpoint** `POST /` (or same worker).
- **Payload shape (extended):**
  - Existing: `date`, `briefingRating`, `mustReads`, `sections`, `openNotes`, `submittedAt`.
  - New: `sections` becomes array of `{ id, label, snippet, rating, note }` (when present).
  - New: `mustReads` entries can include `snippet`, `feedProvidedNoNews`, `feedLooksBroken`, `note`.
  - New: `iterationRequest` (string, optional).
- **Logic:**
  1. If payload has the new contextual shape and (any section note/rating, any article canned/note, or non-empty `iterationRequest`): write `docs/iteration-requests/YYYY-MM-DD-HHmmss.md` with the rich Markdown content above. Create the directory via GitHub API if needed.
  2. Continue to write `data/feedback-latest.json` for the nightly run (same as today, or extended with new fields for synthesis to use).

---

## 5. Cursor workflow (unchanged)

- Open repo → `docs/iteration-requests/` → pick one or more `.md` files.
- Use content (topic + what was written + your note + iteration request) as input for brainstorm → plan → implementation.
- When done: delete the file or move to `docs/iteration-requests/done/`.

---

## 6. Summary table

| Piece | What happens |
|-------|----------------|
| **Section widgets** | After each section: rating (with labels, e.g. Great/Bad signal) + optional text; snippet of section body attached; all sent in payload and written to iteration file. |
| **Article widgets** | Love/OK/Skip + "Feed provided no news" / "Feed looks broken" + optional text; snippet (e.g. "Why read it") attached; sent and written. |
| **Global panel** | Overall rating, notes, + "How should PRISM change?" textarea; iteration text written to iteration file. |
| **Worker** | Writes `data/feedback-latest.json` (nightly) and, when relevant, one rich `docs/iteration-requests/YYYY-MM-DD-HHmmss.md` with full context. |
| **Cursor** | Reads iteration folder; full context (topic + what was written + rating/note) in each file for brainstorm → plan → implementation. |

---

## 7. Implementation order (suggested)

1. **Extract section bodies and article snippets** in `page.js` from the briefing markdown; pass into `buildPage`.
2. **Redesign section widgets** in the HTML: inject after each section *content* (not just header), include snippet in data, add rating labels + optional text input.
3. **Redesign article widgets:** add canned "Feed provided no news" / "Feed looks broken" + optional text; attach snippet.
4. **Extend payload** in the page script: sections as array of { id, label, snippet, rating, note }; mustReads with snippet, feedProvidedNoNews, feedLooksBroken, note; iterationRequest from new textarea.
5. **Worker:** add branch to write `docs/iteration-requests/YYYY-MM-DD-HHmmss.md` with the rich Markdown format; ensure `docs/iteration-requests/` exists (GitHub API create file in path creates dirs implicitly? Check — may need to create a placeholder file first).
6. **Keep** writing `data/feedback-latest.json`; optionally extend it with new fields for synthesis in a later step.
