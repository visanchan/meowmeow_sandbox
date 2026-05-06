# Reading Errors — what the messages mean

> A practical reference for when the dev server, browser, or build complains. Companion to [LEARNING.md](LEARNING.md).
> The skill isn't memorizing every error — it's recognizing the *category* and knowing where to look. Everything below is a category + the one-line decision tree.

---

## How to read an error in 10 seconds

1. **Find the file path** in the error. (Almost every error names a file.)
2. **Find the line number.** (Almost every error names a line.)
3. **Read the error TYPE** (the first phrase, e.g. "TypeError", "Module not found").
4. **Open the file at that line.** Most of the time, the answer is visible there.

That's 80% of debugging. The rest of this doc is "if step 3 is unfamiliar, here's what it means."

---

## Where errors appear

| Where you see it | What it's telling you |
|---|---|
| **Terminal where `npm run dev` is running** | Server-side error: a server component, a Server Action, or a build problem. The page may show "Error" instead of content. |
| **Browser DevTools Console** | Client-side error: a client component crashed, a fetch failed, or React complained. |
| **Browser DevTools Network tab (red rows)** | A request to the server returned an error status (4xx, 5xx). Click the row to see what came back. |
| **The page itself, full-screen "Error" overlay** | Either next.js's error overlay (clickable, has a "fix" button) or the `error.tsx` boundary. |
| **`npm run build` output** | A *build-time* error — usually TypeScript or a stricter check than the dev server. |
| **Supabase Studio "Logs" panel** | An RLS denial, an SQL error inside a function, or a constraint violation. |

If you don't know where the error is happening, check Terminal and Console — between them, you'll see it.

---

## TypeScript errors

These usually look like:

```
Property 'foo' does not exist on type 'Bar'.
```

**What it means:** the code is trying to read or call something that the types say doesn't exist on that object.

**How to fix:**
- 90% of the time, you typo'd a property name. Check the type definition (Cmd/Ctrl + click on the type name in your editor).
- 5%: the object's *type* is wrong. Look for the function that returned it; maybe it should return a different type.
- 5%: the type definition is stale. Look at `src/lib/database.types.ts` — does it reflect the latest schema?

**Common ones in MochiPOS:**

| Error | Likely cause |
|---|---|
| `Property 'X' does not exist on type 'Database['public']['Tables'][...]['Row']'` | `database.types.ts` is out of date with `schema.sql`. Add the column to the type, or remove the reference. |
| `Type 'string' is not assignable to type '"cash" \| "promptpay" \| ...'` | You're trying to set a value that's not in the union. Check the allowed values in `src/lib/pos/types.ts`. |
| `Object is possibly 'null'` | A query result might be null. Add a null check: `if (!data) return null;`. |
| `Argument of type 'X' is not assignable to parameter of type 'Y'` | The function expects a different shape. Read the function signature; the types are usually right and your input is wrong. |

**Don't:** disable TypeScript checking with `// @ts-ignore` or `as any` to silence the error. That hides the bug.

---

## Module not found / Cannot find module

```
Module not found: Can't resolve '@/lib/foo'
```

**Causes (in order of likelihood):**
1. Typo in the import path.
2. The file exists but with a different extension (`.ts` vs `.tsx`).
3. The path alias `@/*` isn't set up — but in MochiPOS it is, so this is rare.
4. You created a new file but the dev server hasn't picked it up — restart `npm run dev`.

**Fix:** double-check the path matches a real file. In MochiPOS, `@/...` maps to `src/...`.

---

## Hydration mismatch

```
Hydration failed because the initial UI does not match what was rendered on the server.
```

**What it means:** the server rendered HTML one way, then the browser tried to render it differently on the first client render. React notices and complains.

**Common causes in MochiPOS:**
- A client component used `Date.now()` or `Math.random()` outside `useEffect` — the server's value differs from the browser's.
- A client component reads from `localStorage` during the initial render — `localStorage` is empty on the server.
- A timezone-dependent format ran on both server and client — they disagreed.

**Fix:**
- Move the dynamic value into a `useEffect`. The first render uses a placeholder; the second render (after mount) uses the real value.
- Look at `src/lib/hooks/useLocalStorageState.ts` for the canonical pattern in MochiPOS.

---

## "Cannot read properties of undefined (reading 'X')"

The most common JavaScript runtime error.

**What it means:** you tried to access `something.X`, but `something` is `undefined`.

**Fix:**
1. Find where `something` came from.
2. Add a guard: `if (!something) return null;` or use optional chaining `something?.X`.

In MochiPOS this often happens when:
- A query returned `null` and the caller didn't check (e.g., `data.brand_name` when `data` is null because the user has no workspace).
- Demo mode is reading from localStorage that hasn't loaded yet (use the `ready` flag in demo hooks).

---

## Supabase / RLS errors

### `new row violates row-level security policy for table "X"`

**What it means:** the database refused to insert/update because the caller doesn't satisfy the RLS policy.

**In MochiPOS this means:** you're trying to write a row whose `workspace_id` doesn't match a workspace you're a member of, OR the table requires writes via an RPC and you tried direct insert.

**Fix:**
- Check `database/rls-policies.sql` for that table. Is there an INSERT policy? What does it require?
- If the table says "writes only via RPC" (e.g. customer-portal tables), you must call the RPC, not insert directly.

### `permission denied for function X`

**What it means:** the role you're calling as doesn't have execute permission on the function.

**Fix:** see the bottom of the function file — it should have a `grant execute ... to authenticated` line. If you're calling as anon and there's no `to anon`, that's why.

### `JWT expired`

**What it means:** the user's session timed out.

**Fix:** redirect to `/login`. The middleware in `src/proxy.ts` should handle this for most routes.

### `relation "X" does not exist`

**What it means:** the table doesn't exist in the database.

**Fix:** you forgot to run a migration. Open `database/schema.sql` (or the migration that adds it) and run it in Supabase SQL Editor.

---

## Server Action errors

### `Server Action "X" was not found`

**What it means:** Next.js couldn't find the server function.

**Fix:** the file with the action must have `"use server"` on line 1, and the function must be exported.

### Action fails silently

If a server action seems to do nothing:
1. Check the **terminal** running `npm run dev` for errors. Server actions log there, not in browser console.
2. Check the Network tab — find the POST request, look at the response.
3. Add a `console.log("got here", values)` near the top of the action to confirm it's being called.

---

## Build errors (`npm run build`)

The build is stricter than the dev server. Things that work in dev might fail in build.

**Common build-only errors:**

| Error | Likely cause |
|---|---|
| `Type error: ...` (in build but not in dev) | The dev server skips strict type checks for speed. Run `npx tsc --noEmit` to see all type errors at once. |
| `Module not found` (in build but not in dev) | Case-sensitivity. Mac/Windows are case-insensitive; Linux (Vercel) is case-sensitive. Check imports match exact filename casing. |
| `useState is not a function` | A client hook is being used in a server component. Add `"use client"` to the file. |

---

## Vercel deployment errors

### Build fails on Vercel but works locally

Most likely:
- An env var is missing on Vercel. Check the build logs for "process.env.X is undefined."
- A package was added to `dependencies` but not committed (check `package.json`).
- A file referenced by an import isn't committed (check `git status`).

### Page returns 500 on Vercel

- Open Vercel project → Deployments → click the deployment → "Functions" tab → look for runtime logs.
- Most common: Supabase env var pointing to a different project than the one with your data.

---

## How to ask the AI for help with an error

Bad prompt: *"my page is broken"*

Good prompt:
```
The /apply page errors with "Property 'foo' does not exist on type 'Bar'"
in src/app/apply/Form.tsx line 42.

Here's what I did before it broke: [one sentence].
Here's the relevant code: [paste the line + 5 around it].

Help me understand what's wrong.
```

The more specific the file + line + recent change, the faster the AI can pinpoint the cause. Without that, the AI has to guess and may waste your time exploring the wrong area.

---

## When in doubt

1. Read the error type, file, line.
2. Look up the type in this doc.
3. Open the file at that line.
4. If still stuck, copy the **full error message + the offending file's lines around the error** into a message to the AI.

Don't worry about looking unsure. Errors are how you learn the codebase.
