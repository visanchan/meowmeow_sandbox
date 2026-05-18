# Skills — Meowmeow POS

Recorded methodology for working on this repo. Built up from real sessions; each section names a concrete situation and the steps that worked. Future agents (Claude or Codex) should read this alongside [CLAUDE.md](CLAUDE.md) / [codex.md](codex.md) before starting non-trivial work.

When you learn a repeatable approach (good or bad), append a new section here. Don't delete sections; mark them stale if behavior changes.

---

## 1. Investigating a user-reported bug

**Trigger**: user describes drift, miscount, or "wrong number" symptom — usually in broken English, often referencing memory of past findings.

**Steps**:
1. Read [CLAUDE.md](CLAUDE.md) and [TASKS.md](TASKS.md) before touching anything.
2. Re-read the user's message line by line. Translate broken English into specific actions if needed.
3. Check `~/.claude/projects/.../memory/` — there may be a `project_post_event_findings_*.md` or similar. **Memory may be stale.** Verify each claim in the memory against current code (grep, read) before treating it as fact.
4. Cross-check git log: search for commits that may have addressed earlier instances of the same issue. Quote the SHAs back to the user so they know what's already on `main`.
5. Spawn a parallel `Explore` (read-only) or `general-purpose` agent for the breadth-first audit. Give it a structured prompt:
   - Authoritative business rules (point to README sections).
   - List of state fields whose writes must be traced.
   - Specific scenarios with expected vs current behavior.
   - Output format: invariant-by-invariant verdict + edge-case gaps + final verdict.
6. While the agent runs, do your own targeted grep for the relevant function names, especially those the user named ("Added Today", "sample", "warehouse"). Trace state writes manually.
7. **Cross-check the agent's findings.** Agents can be wrong. Re-read function bodies — claims like "stale cache" may not survive a line-level read. Reject claims you can't reproduce.
8. Synthesize findings into a bug list with `file:line` refs. Show the user the list and ask one specific question per ambiguity (don't list five questions when one will do).

**What worked in real sessions**:
- Batch DD: 6 confirmed bugs found via parallel Explore + own trace; 2 of the agent's claimed bugs were rejected after line-level verification.
- Batch EE: 2 more bugs discovered as edge-case gaps in the deep-trace audit during DD verification — bugs the user had not even reported.

**What didn't work**:
- Trusting memory verbatim. Memory said "warehouse drift" was unfixed, but git log showed batch CC iter1-5 had shipped fixes a day earlier. Always cross-check current state.
- Assuming bug fixes from a prior batch were sufficient. Real-event use surfaced subtle interactions (per-day sample causing reconciler drift) that earlier batches didn't catch.

---

## 2. Planning and executing a batch (two-agent protocol)

**Trigger**: user approves work that touches `meowmeow_pos_event.html` or other implementation files.

**Steps**:
1. Pick scope. If the user says "you decide", choose the minimal cohesive batch. If multiple bugs share the same code region, bundle them; if they're independent, split.
2. Confirm scope with user before claiming. Use 2-3 sentence response with one or two specific yes/no questions if anything is unclear.
3. Branch off the latest `main` (or off another open batch branch if dependent — set `--base` accordingly when opening the PR). Branch name: `batch/<letter>-<short-slug>`.
4. Update [TASKS.md](TASKS.md): add a Batch entry with business objective, expected benefit, items, touches, do-not-change, acceptance checks, risks. Set `Owner: claude`, `Status: in-progress`, `Branch: ...`, `Claimed: <YYYY-MM-DD HH:MM>`.
5. Commit the claim before touching any implementation file. Commit message: `[batch <letter>] claim <slug>`.
6. Implement. Match the existing single-file vanilla HTML/JS style — compressed one-line-per-function. No build step, no new dependencies.
7. Parse-check after edits: `node -e "const fs=require('fs');const html=fs.readFileSync('meowmeow_pos_event.html','utf8');const m=html.match(/<script>([\s\S]*?)<\/script>/g);const last=m[m.length-1].replace(/^<script>|<\/script>$/g,'');try{new Function(last);console.log('OK');}catch(e){console.log('ERR:',e.message);process.exit(1);}"`
8. Update / extend [tests/smoke_event_pos.js](tests/smoke_event_pos.js) for any new behavior. Run with `NODE_PATH="C:/Users/USER/Desktop/meowmeow_sandbox/pos-for-sell/node_modules" node tests/smoke_event_pos.js`.
9. Update [readme.md](readme.md) with any behavior change (Inventory, Correction Center, Send Later, etc.).
10. Move the Batch entry's status to `ready-for-review` in [TASKS.md](TASKS.md).
11. Commit, push, open PR with the handoff template (see section 7).
12. For high-risk batches (touches inventory, correction, payment, receipt, CSV, or staff workflow), request Codex review before merge per CLAUDE.md.

**Stacked PR pattern** (when batch B depends on batch A and A isn't merged yet):
- Branch B off A: `git checkout -b batch/b-... batch/a-...`.
- Open B with `gh pr create --base batch/a-...` so the PR shows only B's changes against A.
- After A merges, B's base auto-retargets to `main`.
- Note the merge order in the PR description.

---

## 3. Verifying math invariants

**Trigger**: user asks "does the math align with business flow?" or before merging a batch that touched inventory, payment, or correction logic.

**Invariants in this codebase** (use these as the verification spine):

| # | Invariant | Where computed |
|---|---|---|
| 1 | Warehouse: `max(0, global − online − cumulativeAllocated − committed)` | `stockSetupSnapshot` |
| 2 | Per-day sellable: `starting + added − globalSample − sold` | `getDayRemainingMap`, `getProductInventorySnapshot` |
| 3 | Carry-forward: `Day(N+1).starting = Day(N).starting + Day(N).added − Day(N).sold` (no sample sub) | `getDayPhysicalAtBoothMap` via `realignInventoryCarryForward` and `closeOperatingDay` |
| 4 | Reconciler: `cumulativeAllocated = remainingCurrentDay + globalSample + totalSold` | `reconcileInventoryReport` |
| 5 | Sample bucket — only 4 documented write paths | `convertEventToSample`, `convertSampleToEvent`, `confirmInventoryCorrection`, `migrateSampleQtyToGlobal` |
| 6 | Sale total: `subtotal − discount + delivery + cardSurcharge` | `cartTotals`, `correctionTotalsFromItems` |
| 7 | Free gift: `lineTotal=0`, deducted from booth, excluded from paid top-sellers | `createFreeGiftLine`, `getDaySoldMap`, dashboard top-sellers |
| 8 | Card surcharge: `(merchandise + delivery) × 0.03`, only when `payment === 'card'` | `cartTotals`, `correctionTotalsFromItems` |
| 9 | Send Later: increments `committed`, paid at event, ships from warehouse, NOT booth | `finalizeSale`, `sendLaterReservedQty`, `getDaySoldMap` |
| 10 | Bill correction: `realignInventoryCarryForward(saleDay)` + `rebuildSendLaterQueueForSale(sale)` | `confirmCorrectionSave` |

**Steps**:
1. List the invariants relevant to the batch.
2. For each: grep every WRITE to its inputs. Confirm each write is one of the documented business operations (sale, void, refund, correction, top-up, top-up reversal, sample make, sample return, day close, bill correction, free gift, send later) or that it preserves the invariant.
3. Spawn a deep-trace agent to do this independently. Cross-check.
4. Run [tests/smoke_event_pos.js](tests/smoke_event_pos.js). The reconciler test should report `isOk=true` and `allocatedDelta=0` after every operation.

**Why "warehouse formula uses cumulativeAllocated, not current-day"**:
- `cumulativeAllocated = day1.startingStock + sum(addedStock across all days)`. This is the only correct denominator on Day 2+.
- Using current-day fields (`row.eventStarting + row.addedToday`) drifts on Day 2+ because Day 2 startingStock is a derivation (carry-forward), not a fresh allocation.
- Fixed in DD; was previously wrong in `refreshPreview` (live preview) and `buildInventoryCorrectionDraft` (validation).

---

## 4. Refactoring a data model with migration

**Trigger**: state shape change that affects existing localStorage data (e.g. moving sample from per-day to global in DD).

**Pattern**:
1. Add a boolean migration flag to the relevant state object: `<field>Migrated: false` for old data, `true` for fresh installs.
2. In `createDefault*()`: set the flag to `true` (fresh installs skip migration).
3. In `normalize*(raw)`: read the flag with `Boolean(raw.<field>Migrated)`. Old data (flag undefined) returns `false`, triggering migration on next load.
4. Write a migrate function that reads old shape, writes new shape, sets flag `true`, saves both relevant storage keys.
5. Make the migration **idempotent**. Re-running on already-migrated state must be a no-op.
6. Call the migration in `init()` after both relevant `load*()` calls (so cross-store reads work).
7. For ambiguous heuristics (e.g. sum vs max across days when collapsing), choose the **safe direction**: overestimating a stock count is recoverable via the new UI; underestimating loses physical inventory silently. Document the choice in the batch spec under Risks.

**Example from DD**:
- Pre-DD: `dayRecord.sampleQty[sku]` per day.
- Post-DD: `state.globalInventory.sampleQty[sku]` single bucket.
- Heuristic: `Math.max(per-day samples)` → overestimates if user reduced sample mid-event. Recovery: user clicks `−1 Return` on the new UI. Underestimating would silently lose physical samples.
- Flag: `sampleQtyGlobalMigrated`. Old data without flag → `false` → migration runs once → flag `true` after.

---

## 5. Smoke test patterns and gotchas

**The smoke test is in [tests/smoke_event_pos.js](tests/smoke_event_pos.js)**. Run with:
```
NODE_PATH="C:/Users/USER/Desktop/meowmeow_sandbox/pos-for-sell/node_modules" node tests/smoke_event_pos.js
```
(Playwright lives in the SaaS project's node_modules.)

**Patterns that work**:
- Group scenarios into `await page.evaluate(...)` blocks and assert on returned values outside.
- Reset state between scenarios with a `resetClean()` helper. Zero out **every** field, including new globals (`state.globalInventory.sampleQty[sku] = 0`). Forgetting one leaks state into the next scenario.
- Use deterministic IDs (e.g. `PRE-{billId}-{sku}-{fulfillmentType}`) for testable entities. Lets you assert on existence by ID without scanning.
- Mock destructive operations: stub `link.click` to count downloads instead of triggering them; set `window.showAppNotice` to a counter-spy if you need to check that an error fired.

**Gotchas**:
- **Don't read live state at return time.** `state.inventory.days.day2.startingStock[sku]` evaluated in the return object reflects whatever the LAST scenario left, not the snapshot you wanted. Capture into a local const inside the scenario instead. Burned us in INT-2.
- **`getDaySoldMap` includes free-gift items** (it filters `isPreorder` and `reserved_send_later` only). The "exclude free gift from sold" rule is in dashboard top-sellers, not in `sold`. Burned us in INT-4.
- **Carry-forward must use `getDayPhysicalAtBoothMap`** (no sample sub), not `getDayRemainingMap` (sample sub). Otherwise samples leak across day rollover. Test helpers must mirror production.
- **Sample is global post-DD.** Tests writing to `state.inventory.days.day1.sampleQty[sku]` are stale; write to `state.globalInventory.sampleQty[sku]` and set `sampleQtyGlobalMigrated = true` to skip migration.

---

## 6. Working with the single-file POS

`meowmeow_pos_event.html` is ~2580 lines, vanilla HTML/CSS/JS, no build step, no new CDN deps allowed.

**Read tactics**:
- Full Read fails (file >25K tokens). Always use `Read` with `offset` and `limit`.
- For finding a function: `Grep` with `function <name>` and `output_mode: "content"`.
- Many lines are compressed one-line-per-function (~1000-3000 chars per line). Grep matches show "[Omitted long matching line]" — use `Read` at that line for the full content.

**Write tactics**:
- Match the compressed style. New helpers should fit on one line where reasonable; multi-line is OK if logic warrants it.
- Use `Edit` not `Write` (file is too large to safely overwrite).
- After edits, parse-check with the snippet in section 2 step 7.
- Don't introduce CDN deps or build steps. Don't add comments unless the WHY is non-obvious.

**Where things live**:
- Lines ~1850-2010: state shape and load/save helpers, migrations.
- Lines ~2010-2110: cart line model, fulfillment helpers.
- Lines ~2090-2170: inventory math (snapshots, remaining maps, carry-forward, reconciler).
- Lines ~2150-2200: inventory correction tool (build draft, confirm, allowance).
- Lines ~2150-2210: render helpers for inventory tools.
- Lines ~2210-2270: Stock & Allocation Setup table render + live preview + sample bucket UI.
- Lines ~2270-2310: inventory view (per-day display).
- Lines ~2280-2330: closeOperatingDay, reset, top-up reversal.
- Lines ~2440-2470: finalizeSale.
- Line ~2580: `init()` — load order matters (inventory before globalInventory before migration).

---

## 7. PR / handoff template

Every PR body includes:

```
## Summary
<one-sentence framing + bug list with severity>

## Changes
<grouped by subsystem; each group 1-3 bullets>

## Test plan
- [x] inline script parses
- [x] all prior smoke scenarios still pass
- [x] N new <batch> scenarios pass: <one-line per scenario>
- [ ] Codex review (if high-risk)
- [ ] Manual UX check (if UI-visible)

## Risks
<what could break, and the recovery path>

## Merge order
<for stacked PRs only>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Token / cost estimate** (per [CLAUDE.md](CLAUDE.md)): always include. Format:
```
- Model: claude-opus-4-7 (1M context).
- Approximate input: ~Xk tokens (full code reads, agents, smoke).
- Approximate output: ~Yk tokens (analysis, edits, commit messages, PR body).
- Rates: $15 / 1M input, $75 / 1M output.
- Estimate: ~$Z.ZZ. Mark as estimate; `/cost` for the precise figure.
```

**Always tell the user `gh pr create` returned which URL** so they can open it.

---

## 8. When the user says "run end to end" or "do it now"

This is the autonomous-mode trigger. Memory entry: `feedback_run_nonstop.md` ("run non-stop"). Equivalent phrases used here: "run end to end", "do that now", "the whole app ready to use".

**What this means**:
- No mid-run confirmation pauses for scope decisions you can make yourself.
- Long-haul work — claim batch, implement, test, commit, push, PR, in one session.
- Surface blockers explicitly only if they actually block (security, ambiguous business rule, missing access). Don't pause for cosmetic decisions.
- Update the user with one-line progress at key transitions (claimed branch, smoke green, PR opened) — don't go silent.

**What to do**:
1. Pick scope yourself if user says "you decide". Default to one cohesive batch.
2. For ambiguous heuristics, choose the safe direction and document in Risks.
3. End with the handoff template + token/cost estimate. The user will review the PR async.

---

## 9. Two-project context

This sandbox holds two distinct projects:
- **Project 1** — `meowmeow_pos_event.html` (this README + skill.md describe). Single-file vanilla. Used live at Pet Expo events.
- **Project 2** — `pos-for-sell/` (Next.js 16 + TS + Tailwind v4 + Supabase + Resend + Vercel). SaaS sister product. Separate [pos-for-sell/CLAUDE.md](pos-for-sell/CLAUDE.md), separate batches (DD-XX numbering, "Wave N" commit prefix).

**Don't cross-pollinate code between them.** They share concepts (sample bucket, warehouse formula, carry-forward) but are independent codebases. A fix on one is documented; the sister fix on the other should be planned as its own batch.

When the user references a "wave" or "DD-XX" batch number, they mean Project 2.

---

## 10. Memory hygiene

Auto-memory files persist across sessions in `~/.claude/projects/.../memory/`. Useful but **always go stale**.

**Before acting on a memory claim**:
- If the memory names a file path → confirm the file exists.
- If the memory names a function or flag → grep for it.
- If the memory describes "what's broken" → cross-check git log for fixes since the memory was written.
- If the memory names a date → verify against the system's `currentDate`. The "free runs through May 5, 2026" claim outlived the actual cutoff.

**When a memory contradicts current code, trust current code.** Update or remove the stale memory so future sessions don't repeat the mistake.

---

## 11. Anon-callable RPC with token credential (SaaS pattern)

**Trigger**: a customer-facing surface needs to write to the database, but the customer doesn't have a Supabase auth session (e.g. post-purchase Customer Portal, public unsubscribe link, anonymous review submission).

**The pattern** (proven in pos-for-sell Wave 40a):

1. **Issuer-side** — when the seller-facing flow has a moment where the token can be created (e.g. order completes), call an authenticated RPC like `create_X_token(parent_id)` that:
   - Validates the caller is a workspace member with the right role.
   - Generates an opaque random token (15+ bytes from `gen_random_bytes`, base64-stripped to a URL-safe ~16-char string).
   - Inserts a row in a `*_tokens` table with `expires_at = now() + interval '90 days'`, `claimed_at = null`.
   - Returns the token string.
2. **Customer-side** — receive the token in a URL (QR / shareable link). Server-side route fetches the token row using the **service-role admin client** (server-only) to validate before rendering the form.
3. **Claim RPC** — `claim_X_token(p_token, p_payload jsonb)` is `security definer` and **`grant execute ... to anon, authenticated`**. It:
   - Locks the token row `for update`.
   - Aborts with `errcode = '22023'` if missing / claimed / expired.
   - Performs all writes atomically (multiple tables in one transaction).
   - Audit-logs with `user_id = null` (anon flow has no `auth.uid()`).
   - Marks the token claimed.
   - Returns the new entity id.
4. **RLS** — `*_tokens` table has RLS on with **member-SELECT only**, no anon-SELECT policy. The token is the credential; it never leaks via direct read.

**Why it works**:
- The token IS the credential. Two different physical people, two different sessions, one shared opaque secret — exactly the booth-cashier-then-customer flow.
- All writes go through one SECURITY DEFINER RPC. No anon SQL surface; the database policy is "anon can call this one function, nothing else."
- Audit log captures every claim with timestamp + payload-shape; `user_id null` rows are visibly anon.
- 90-day expiry gives customers time to register on their own pace; 16-char base32-style gives ~80 bits of entropy, sufficient for non-guessable tokens.

**What didn't work** (rejected during the design):
- Putting an anon SELECT policy on the token table with a "where token = X" clause. Tokens become scrapable from URLs; entropy isn't enough on its own without the SECURITY DEFINER aborts-on-claimed gate.
- Requiring customer auth before claim. Defeats the speed goal at the booth; customers walk away rather than sign up.

---

## 12. Two-layer SaaS architecture (POS App + Customer Portal)

**Trigger**: building a SaaS where the customer-facing experience and the staff-facing experience have very different speed / completeness tradeoffs (POS booth being the canonical case).

**The rule**: **don't ask staff to do CRM during peak sales time.** Customer info, pet profiles, loyalty, marketing consent — all of it lives in a separate customer-facing layer that the customer fills out *after* the sale.

**Implementation pattern** (proven in MochiPOS):

- **Layer A — staff-facing app**: routes under `/app/*`, gated by `workspace_members` membership. Required-to-save fields are minimal. Customer fields are optional even when present (e.g. shipping info for Send Later). No CRM UI.
- **Layer B — customer-facing portal**: routes under `/register/[token]` (or similar). Anon, mobile-first. Captures the full profile via a SECURITY DEFINER RPC keyed by token (see pattern 11).
- **Bridge**: a one-shot token in a `*_registration_tokens` table. Issued by the staff-facing app at sale completion; redeemed by the customer at any later time via QR or shareable link.
- **Hard rule for code reviews**: pet UI / CRM widgets must not appear in `/app/*` batches. If you see them there, move them to the portal.

**Why "checkout first, profile later" matters in real numbers**:
- A booth doing 100 customers/hour with 45-second profile capture per sale = **75 staff-minutes spent on data entry per hour**. That's an entire cashier's worth of time.
- Customers under queue pressure type the wrong number, give the wrong pet name, skip the field, or walk away. Data quality is worse than capturing nothing.
- A QR on the receipt converts to genuine, accurate, customer-typed registration — at 30%+ rates if the offer is good (loyalty, future product recommendations, pet-specific reminders).

**When to apply**: any SaaS that puts staff between the customer and the data. Booth POS, restaurant POS, salon booking, queue-management apps — the "do CRM later" rule applies broadly.

**When not to apply**: SaaS where the same person plays both roles (self-checkout, e-commerce). There you can ask for everything upfront because there's no queue waiting.

---

## 13. Stacked PR recovery after squash-merge

**Trigger**: PR B was branched off PR A's branch (e.g. `batch/ee-...` off `batch/dd-...`). PR A is squash-merged with `--delete-branch`. GitHub closes PR B because its base disappeared.

**The pattern**:
1. Don't try to retarget PR B in the GitHub UI — it'll show all of A+B's changes as a diff against new main, since squash discards the original commits.
2. Cherry-pick approach (cleanest):
   ```bash
   git checkout main && git pull
   git checkout -b batch/x-name-v2
   git cherry-pick <last-commit-of-original-B-branch>  # only B's changes
   ```
   If multiple commits, cherry-pick the range that's B-only.
3. Verify the diff matches expectations (`git diff main`).
4. Push the new branch and open a fresh PR (`gh pr create --base main`).
5. Update the original PR B's body with a "superseded by #N" note for traceability.

**What didn't work** (burned us once during DD/EE):
- `git rebase origin/main` on the EE branch — produced merge conflicts because the squash combined DD's commits, and EE's commits were applied on top of DD's individual commits. The conflicts are noise to resolve manually.

**Lesson**: when you know a stack-of-PRs strategy is in play, prefer **rebase B onto A's last commit before squash** (or just merge A as a regular merge to preserve commit history). For squash workflows, cherry-pick is the recovery.
