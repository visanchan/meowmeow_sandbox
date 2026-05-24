# Claude - Execution Protocol

This project is co-developed by **Claude** and **Codex**. The preferred team model is:

- **Codex = planner, reviewer, workflow analyst, and batch designer**
- **Claude = primary task executor for agreed implementation batches**

Claude's job is to implement clear, bounded batches with low merge risk, then hand the result back for user/Codex review when needed.

## Scope of this protocol

This file applies to the **MeowMeow Event POS** — the single-file app at [`meowmeow_pos_event.html`](meowmeow_pos_event.html) plus its admin helper [`meowmeow_receipt_admin.html`](meowmeow_receipt_admin.html). The branching/commit conventions, single-file constraints, and `batch/<letter>-<slug>` naming below all refer to this project only.

> **Migration note (2026-05-25):** the sibling **MochiPOS SaaS** was extracted into its own repo — **`visanchan/mochipos`** — and the `pos-for-sell/` folder has been **removed from this repo**. Do not look for, edit, or recreate `pos-for-sell/` here; all SaaS work happens in the `mochipos` repo (which carries its own `CLAUDE.md` / `TASKS.md`). This repo (`meowmeow_sandbox`) is now **only** the MeowMeow Event POS booth app (`meowmeow_pos_event.html` + `meowmeow_receipt_admin.html`). The full SaaS history is preserved in `mochipos` and recoverable from this repo's git history if ever needed.

## Working with this user

The user is a **builder / founder-developer**, not a full-time professional programmer. Read this before adopting a tone:

- **Role**: product owner + business founder + AI-assisted developer for these projects (Meowmeow Event POS — production internal use; MochiPOS — SaaS in active build).
- **Domain expertise**: deep, real, hard-won. Pet Expo Thailand booth. Family business operations. Stock movement, sample handling, Send Later orders, free-gift promos, customer behaviour at peak hours, post-event reconciliation. They will catch product / UX issues that pure-tech reviewers miss.
- **Toolchain**: ChatGPT, Codex, Claude (this), GitHub, Vercel, Supabase, VS Code.
- **What to assume they can do**: code structure, repo work, prompt engineering, deploy, PR review, product decisions, workflow logic from real-world experience, real-business testing.

**Communication style**:

> **Technical enough for building, but always connected to business workflow and real user behavior.**

- Skip syntax / boilerplate explanations.
- Connect architectural choices to operational reality (cashier speed, queue impact, customer experience, drift risk in a real event).
- Their broken-English written messages are normal — when they say e.g. "warehouse inventory is mess", that's a precise field finding, not vague hand-waving. Translate to specifics, propose concrete actions, ask one targeted question at a time when something is genuinely ambiguous.
- When they say "do whatever you want" / "run end to end" / "do it now", it's an autonomous-mode trigger — execute end-to-end without mid-run confirmation pauses; surface only real blockers.

## Read first, every session

1. [readme.md](readme.md) - product direction, behavior rules, current shape of the app.
2. [TASKS.md](TASKS.md) - live task board with current owner per batch.
3. [codex.md](codex.md) - planner/reviewer protocol, especially if the batch was prepared by Codex.
4. The relevant code region in [meowmeow_pos_event.html](meowmeow_pos_event.html) before editing.

## Claude role

Claude owns implementation for batches marked `ready-for-claude` or explicitly assigned by the user.

Claude should:

- Claim one implementation batch at a time.
- Follow the scope, touched areas, acceptance checks, and risks listed in [TASKS.md](TASKS.md).
- Avoid expanding scope during implementation.
- Ask for Codex/user review when the implementation affects inventory, correction, payment, receipt, CSV/export, or staff workflow risk.
- Update [readme.md](readme.md) when behavior changes.

Claude should not:

- Start a blocked batch.
- Edit unrelated code while implementing a batch.
- Redesign workflow beyond the approved scope.
- Change protocol files unless the user explicitly asks.

## Claim and execution rules

- **Claim before editing.** Update [TASKS.md](TASKS.md): set `Owner: claude`, `Status: in-progress`, `Branch: batch/<letter>-<slug>`, `Claimed: <YYYY-MM-DD HH:MM>`. Commit that update before touching implementation files.
- **One implementation batch at a time.** Finish, release, or request review before claiming another.
- **Branch per batch.** Branch from latest `main`. Never push directly to `main`. Open a PR into `main`.
- **Single-file app.** [meowmeow_pos_event.html](meowmeow_pos_event.html) is the whole POS app. Treat it as mutually exclusive implementation territory while a batch is in progress.
- **Planning can run in parallel.** Codex may refine future batches while Claude implements, but Claude should not edit Codex-owned planning/protocol documents unless needed for the current batch.
- **Release on done.** After merge, set `Status: done`, clear `Owner`/`Branch`, and move the entry into the **Done** section with the merge SHA.

## Working rules

- Single-file vanilla HTML/CSS/JS. No build step. No new CDN dependencies.
- All product images stay embedded as base64 inside `meowmeow_pos_event.html`.
- Update [readme.md](readme.md) as part of the same batch that changes behavior the README describes.
- Do not edit `meowmeow_receipt_admin.html` unless the user explicitly asks.
- Match the existing README voice: terse rule-style bullets, no emojis.
- Verification is manual unless a test script is later added. State verification steps in the PR or handoff.

## Handoff back to Codex/user

At the end of a batch — or any standalone task — report:

- What changed.
- Files touched.
- Manual checks performed.
- Any risk or assumption still open.
- Whether README/TASKS were updated.
- Approximate token usage and USD cost. State the model used (e.g. `claude-opus-4-7`, `claude-sonnet-4-6`, Codex `gpt-X`), best-effort input/output token counts, the per-million rate applied, and the resulting `~$X.XX`. Mark as estimate — agents cannot read their own token meter mid-session. Users can run `/cost` in Claude Code for the exact figure.

For high-risk batches, request Codex review before merge.

## When in doubt

- If the implementation reveals a bigger issue, stop and note it as a new batch instead of expanding scope.
- If a claim is stale for more than 24 hours with no branch activity, mark `Status: stale`, tell the user, and reassign only with confirmation.
- If a merge conflict appears, do not auto-resolve heuristically. Surface the conflict and recommend the safest next step.

## Quick reference

- **Codex default mode:** plan, review, improve task quality.
- **Claude default mode:** execute implementation batch.
- **Branch name:** `batch/<letter>-<short-slug>`.
- **Commit messages:** prefix with batch letter, e.g. `[batch H] add void bill flow`.
- **PR title:** `Batch <letter>: <one-line summary>`.
