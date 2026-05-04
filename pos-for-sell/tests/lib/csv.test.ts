import { describe, it, expect } from "vitest";
import { escapeCsvCell, toCsv, toCsvGrid } from "@/lib/csv";

describe("csv/escapeCsvCell", () => {
  it("returns plain strings unquoted", () => {
    expect(escapeCsvCell("hello")).toBe("hello");
  });

  it("quotes commas, quotes, newlines", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvCell("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it("renders null/undefined as empty", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("stringifies numbers and booleans", () => {
    expect(escapeCsvCell(123)).toBe("123");
    expect(escapeCsvCell(true)).toBe("true");
  });
});

describe("csv/toCsv", () => {
  it("infers headers from first row", () => {
    const out = toCsv([
      { name: "Aim", phone: "0812345678" },
      { name: "Visan", phone: "0898765432" },
    ]);
    expect(out).toBe("name,phone\r\nAim,0812345678\r\nVisan,0898765432");
  });

  it("respects explicit header order", () => {
    const out = toCsv([{ a: 1, b: 2, c: 3 }], ["c", "a"]);
    expect(out).toBe("c,a\r\n3,1");
  });

  it("returns empty string for empty input without headers", () => {
    expect(toCsv([])).toBe("");
  });
});

describe("csv/toCsvGrid", () => {
  it("composes header + rows", () => {
    const out = toCsvGrid(["a", "b"], [[1, 'q,"x"']]);
    expect(out).toBe('a,b\r\n1,"q,""x"""');
  });
});
