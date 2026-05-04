import { describe, it, expect } from "vitest";
import {
  generateInviteCode,
  isInviteCodeFormat,
  DEFAULT_PREFIX,
} from "@/lib/invite-code";

describe("invite-code/generateInviteCode", () => {
  it("uses default prefix and 2 groups", () => {
    const c = generateInviteCode();
    expect(c.startsWith(`${DEFAULT_PREFIX}-`)).toBe(true);
    const parts = c.split("-");
    expect(parts.length).toBe(3);
    expect(parts[1].length).toBe(4);
    expect(parts[2].length).toBe(4);
  });

  it("respects custom prefix and group count", () => {
    const c = generateInviteCode({ prefix: "ABC", groups: 3 });
    const parts = c.split("-");
    expect(parts[0]).toBe("ABC");
    expect(parts.length).toBe(4);
  });

  it("never emits ambiguous chars (I, L, O, 0, 1) in the random groups", () => {
    // The prefix is allowed to contain any chars (e.g. "CATBOOTH" has O+T);
    // the rule applies only to the generated 4-char chunks.
    for (let i = 0; i < 200; i++) {
      const c = generateInviteCode();
      const groups = c.split("-").slice(1);
      for (const g of groups) {
        expect(g).not.toMatch(/[ILO01]/);
      }
    }
  });

  it("isInviteCodeFormat passes generated codes", () => {
    for (let i = 0; i < 50; i++) {
      expect(isInviteCodeFormat(generateInviteCode())).toBe(true);
    }
  });

  it("isInviteCodeFormat rejects malformed", () => {
    expect(isInviteCodeFormat("ABC-1234-5678")).toBe(false); // contains 0/1
    expect(isInviteCodeFormat("ABC-AAA-BBBB")).toBe(false); // wrong group lengths
    expect(isInviteCodeFormat("nothing")).toBe(false);
  });
});
