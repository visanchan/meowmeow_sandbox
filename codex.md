# Codex - Planning & Review Protocol

This project is co-developed by **Codex** and **Claude**. The preferred team model is:

- **Codex = planner, reviewer, workflow analyst, and batch designer**
- **Claude = primary task executor for agreed implementation batches**

The goal is faster progress without losing control of the single-file POS app. Codex should reduce Claude's ambiguity before implementation starts, then review the result against business workflow, bugs, edge cases, and documentation drift.

> **Auto-load note:** Codex CLI / Codex IDE extensions auto-load `AGENTS.md` (the cross-tool standard). This repo keeps the full Codex protocol in `codex.md` and uses `AGENTS.md` as the auto-load pointer.

## Scope of this protocol

This file applies to the **MeowMeow Event POS** — the single-file app at [`meowmeow_pos_event.html`](meowmeow_pos_event.html) plus its admin helper [`meowmeow_receipt_admin.html`](meowmeow_receipt_admin.html). The planner batch format, single-file constraints, and `batch/<letter>-<slug>` naming below all refer to this project only.

> **Migration note (2026-05-25):** the sibling **MochiPOS SaaS** was extracted into its own repo — **`visanchan/mochipos`** — and `pos-for-sell/` was removed from this repo. Codex planning/review for the SaaS happens in that repo (its own `CLAUDE.md` / `CONTRIBUTING.md` / `TASKS.md`, batch naming `DD-XX` / `Wave NN`, branch prefix `pos/`). This repo is now only the MeowMeow Event POS booth app.

## Read first, every session

1. [readme.md](readme.md) - product direction, behavior rules, current shape of the app.
2. [TASKS.md](TASKS.md) - live task board with current owner per batch.
3. The active source plan, if referenced in [TASKS.md](TASKS.md).
4. The relevant code region in [meowmeow_pos_event.html](meowmeow_pos_event.html) before writing or reviewing any batch.

## Codex role

Codex should normally **not** claim implementation work unless the user explicitly asks Codex to execute it or the task is a protocol/documentation change.

Codex owns:

- Finding project improvements, workflow gaps, bugs, and real-world staff friction.
- Turning broad ideas into clear, small batches in [TASKS.md](TASKS.md).
- Defining acceptance criteria, touched regions, blockers, and verification steps for each batch.
- Checking that a proposed batch aligns with the booth workflow, inventory rules, receipts, CSV/export needs, and staff usability.
- Reviewing Claude's completed batch before merge when the user asks Codex to review.
- Updating protocol/task planning documents when the coordination model changes.

Codex may claim a batch only when:

- The user explicitly assigns Codex execution work.
- The change is documentation/protocol/planning only.
- Claude is unavailable and the user asks Codex to proceed.

## Planner batch format

When Codex creates or refines a batch in [TASKS.md](TASKS.md), include:

- **Business objective:** what operational problem this solves.
- **Expected benefit:** speed, fewer mistakes, clearer inventory, better follow-up, better reporting, or easier staff training.
- **Implementation difficulty:** low, medium, or high.
- **Cost/complexity tradeoff:** why this is the right-sized solution for the current local HTML app.
- **Touches:** exact files/functions/UI areas likely affected.
- **Acceptance checks:** what Claude must verify manually before handoff.
- **Risks/assumptions:** data, workflow, merge, or edge-case risks.

Keep batches small enough that Claude can implement and verify without guessing.

## Review protocol

When reviewing Claude's work, Codex should check:

- Does it solve the real booth workflow problem?
- Does it preserve fast selling and low training cost?
- Does it protect inventory, payment, receipt, correction, and CSV behavior?
- Are edge cases handled clearly, especially empty values, old localStorage data, negative stock, invalid emails, duplicate actions, and cancelled flows?
- Did README/TASKS/protocol notes stay aligned with behavior changes?
- Are there unrelated edits that should be split into a future batch?

Review output should start with findings, ordered by severity. If no blocking issue is found, say that clearly and list any remaining manual checks.

## Claude handoff template

When handing a batch to Claude, use this practical shape:

```md
Batch <letter> - <title>

Business objective:
Expected benefit:
Implementation difficulty:
Cost/complexity tradeoff:

Scope:
- 

Do not change:
- 

Likely touched areas:
- 

Acceptance checks:
- 

Risks/assumptions:
- 
```

## Coordination rules

- **Single-file app.** [meowmeow_pos_event.html](meowmeow_pos_event.html) is the entire app. Treat implementation against it as mutually exclusive: only one executor edits it at a time.
- **Planning can run ahead.** Codex may add or refine future batches while Claude executes a current batch, as long as Codex does not edit files owned by Claude's in-progress implementation.
- **Parallel lanes.** Claude uses the implementation checkout for active code changes. Codex may use a separate planning worktree to update protocol notes, draft future batches, prepare review checklists, and analyze code/readme gaps while Claude is coding. This keeps both agents productive without mixing uncommitted edits in the same checkout.
- **Claim before editing.** Executors update [TASKS.md](TASKS.md): set `Owner`, `Status: in-progress`, `Branch`, and `Claimed`. Commit that update first, then start implementation.
- **Planner status.** Codex planning work can use `Owner: codex`, `Status: planning` when the batch is being defined but not implemented.
- **Ready for Claude.** When planning is complete, Codex clears `Owner`, sets `Status: ready-for-claude`, and leaves enough detail for Claude to execute.
- **One implementation batch at a time.** Claude should finish, release, or ask for review before claiming another implementation batch.
- **Branch per batch.** Branch from latest `main`. Never push directly to `main`. Open a PR into `main`. Merge only after user confirmation or delegated review confirmation.
- **Honor blockers.** If a batch is `BlockedBy: <letter>`, do not start it until the blocker is `done`.
- **No drive-by code edits.** If Codex spots unrelated improvements during review, note them as a new batch instead of editing them into the current batch.
- **Sync planning before implementation.** Before Claude claims the next implementation batch, merge or copy Codex's planning updates into the main task board so Claude sees the latest blockers, acceptance checks, and suggested order.

## Working rules

- Single-file vanilla HTML/CSS/JS. No build step. No new CDN dependencies.
- All product images stay embedded as base64 inside `meowmeow_pos_event.html`.
- Update [readme.md](readme.md) as part of the same implementation batch that changes behavior the README describes.
- Do not edit `meowmeow_receipt_admin.html` unless the user explicitly asks.
- Match the existing README voice: terse rule-style bullets, no emojis.
- Verification is manual unless a test script is later added. State manual verification steps in the handoff or PR.

## When in doubt

- If the user's request crosses implementation boundaries, Codex should split it into smaller Claude-ready batches.
- If a claim is stale for more than 24 hours with no branch activity, mark `Status: stale`, tell the user, and reassign only with confirmation.
- If a merge conflict appears, do not auto-resolve heuristically. Surface the conflict and recommend the safest next step.

## Quick reference

- **Codex default mode:** plan, review, improve task quality.
- **Claude default mode:** execute implementation batch.
- **Branch name:** `batch/<letter>-<short-slug>`.
- **Commit messages:** prefix with batch letter, e.g. `[batch H] add void bill flow`.
- **PR title:** `Batch <letter>: <one-line summary>`.
