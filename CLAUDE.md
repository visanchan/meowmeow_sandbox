# Claude — Project Protocol

This project is co-developed by **Claude** and **Codex**. To avoid clobbering each other's work in the single-file POS app, both agents follow a shared protocol.

## Read first, every session

1. [readme.md](readme.md) — product direction, behavior rules, current shape of the app.
2. [TASKS.md](TASKS.md) — live task board with current owner per batch. **You may not edit any file owned by another agent.**
3. The active batch's source plan: `C:\Users\USER\.claude\plans\read-all-code-in-polymorphic-kahn.md`.

## Coordination rules

- **Single-file app.** [meowmeow_pos_event.html](meowmeow_pos_event.html) is the entire app. Treat it as **mutually exclusive**: only one agent edits it at a time, even on different batches, until partition confidence is proven.
- **Claim before editing.** Update [TASKS.md](TASKS.md) — set `Owner: claude`, `Status: in-progress`, `Branch: batch/<letter>-<slug>`, `Claimed: <YYYY-MM-DD HH:MM>`. Commit that update first, then start work.
- **One batch at a time.** Finish or release before claiming another.
- **Branch per batch.** Never push directly to `main`. Open a PR. Merge only after the user confirms (or after Codex confirms no in-flight conflict, if the user delegates that check).
- **Release on done.** After merge, set `Status: done`, clear `Owner`/`Branch`, move the entry into the **Done** section with the merge SHA.
- **Honor blockers.** If a batch is `BlockedBy: <letter>`, do not start it until the blocker is `done`.
- **No drive-by edits.** Do not edit code unrelated to the claimed batch, even if you spot improvements. Note them as a new batch in [TASKS.md](TASKS.md) and surface them to the user.

## Working rules (project-specific)

- Single-file vanilla HTML/CSS/JS. No build step. No new CDN dependencies. All product images stay embedded as base64 inside `meowmeow_pos_event.html`.
- Update [readme.md](readme.md) **as part of the same batch** that changes behavior the README describes. Do not let README drift.
- Do not edit `meowmeow_receipt_admin.html` unless the user explicitly asks — it is out of scope for the current round.
- Match the existing voice in [readme.md](readme.md): terse rule-style bullets, no emojis.
- Verification is manual (open the HTML in Edge/Chrome). There is no test suite. State your verification steps in the PR.

## When in doubt

- If the user's request crosses batch boundaries, propose a new batch in [TASKS.md](TASKS.md) before editing.
- If you find that another agent's claim is stale (>24h, no commits on branch), mark `Status: stale` in [TASKS.md](TASKS.md), tell the user, and only re-claim with their confirmation.
- If a merge conflict appears, do not auto-resolve heuristically — surface the conflict to the user.

## Quick reference

- **Branch name:** `batch/<letter>-<short-slug>` (e.g. `batch/a-operator-gate`).
- **Commit messages:** prefix with batch letter, e.g. `[batch A] move operator chip to selling-screen header`.
- **PR title:** `Batch <letter>: <one-line summary>`.
