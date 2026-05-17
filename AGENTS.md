# Project Agent Instructions

Read [codex.md](codex.md) first.

This project uses a split-agent workflow:

- **Codex:** planning, review, workflow alignment, bug/improvement discovery, batch design.
- **Claude:** primary execution of approved implementation batches.

Use [TASKS.md](TASKS.md) as the live source of truth before editing any project file.

## Sister project

This repo also hosts an active SaaS sibling at [`pos-for-sell/`](pos-for-sell/) — a multi-tenant Next.js + Supabase POS with its own protocol files ([`pos-for-sell/CLAUDE.md`](pos-for-sell/CLAUDE.md), [`pos-for-sell/CONTRIBUTING.md`](pos-for-sell/CONTRIBUTING.md), [`pos-for-sell/TASKS.md`](pos-for-sell/TASKS.md)). Read those instead of this file when working inside `pos-for-sell/`.
