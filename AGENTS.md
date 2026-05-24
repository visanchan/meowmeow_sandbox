# Project Agent Instructions

Read [codex.md](codex.md) first.

This project uses a split-agent workflow:

- **Codex:** planning, review, workflow alignment, bug/improvement discovery, batch design.
- **Claude:** primary execution of approved implementation batches.

Use [TASKS.md](TASKS.md) as the live source of truth before editing any project file.

## Sister project — moved to its own repo (2026-05-25)

The MochiPOS SaaS that used to live here at `pos-for-sell/` has been **extracted into its own repo: `visanchan/mochipos`**, and the `pos-for-sell/` folder has been **removed from this repo**. Do not edit or recreate it here — all SaaS work is in the `mochipos` repo (with its own `CLAUDE.md` / `CONTRIBUTING.md` / `TASKS.md`). This repo is now **only** the MeowMeow Event POS booth app (`meowmeow_pos_event.html` + `meowmeow_receipt_admin.html`).
