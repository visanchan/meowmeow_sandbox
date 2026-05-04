// Invite code generator: ambiguity-safe (no I/L/0/O/1) base32-ish alphabet.
// Format default: "PREFIX-XXXX-YYYY" (8 random chars in two groups of 4).

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars, no I L O 0 1
export const DEFAULT_PREFIX = "CATBOOTH";

export type InviteCodeOpts = {
  prefix?: string;
  /** Number of 4-char groups (excluding the prefix). Default 2. */
  groups?: number;
  /** Random source. Default crypto.getRandomValues; falls back to Math.random. */
  rng?: () => number;
};

export function generateInviteCode(opts: InviteCodeOpts = {}): string {
  const prefix = opts.prefix ?? DEFAULT_PREFIX;
  const groups = opts.groups ?? 2;
  const rng = opts.rng ?? defaultRng;

  const parts = [prefix];
  for (let g = 0; g < groups; g++) {
    let chunk = "";
    for (let i = 0; i < 4; i++) {
      chunk += ALPHABET[Math.floor(rng() * ALPHABET.length)];
    }
    parts.push(chunk);
  }
  return parts.join("-");
}

const INVITE_CODE_RE =
  /^[A-Z0-9]+(?:-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}){2,}$/;

export function isInviteCodeFormat(s: string): boolean {
  return INVITE_CODE_RE.test(s);
}

function defaultRng(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 0xffffffff;
  }
  return Math.random();
}
