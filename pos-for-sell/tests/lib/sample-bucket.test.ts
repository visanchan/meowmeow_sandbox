import { describe, it, expect, expectTypeOf } from "vitest";
import type { Database } from "@/lib/database.types";

// Type-level coverage for Wave 39a. The DB-side Postgres functions
// (convert_event_to_sample / convert_sample_to_event) and the new
// sample_qty column are exercised via integration tests when Supabase
// credentials are wired (currently blocked, see TASKS.md). Until then,
// these tests guard the type contract so the application layer can rely
// on it without a live DB.

type EventInventoryRow = Database["public"]["Tables"]["event_inventory"]["Row"];
type EventInventoryInsert =
  Database["public"]["Tables"]["event_inventory"]["Insert"];
type ConvertArgs =
  Database["public"]["Functions"]["convert_event_to_sample"]["Args"];
type ConvertReturns =
  Database["public"]["Functions"]["convert_event_to_sample"]["Returns"];
type ConvertBackArgs =
  Database["public"]["Functions"]["convert_sample_to_event"]["Args"];
type ConvertBackReturns =
  Database["public"]["Functions"]["convert_sample_to_event"]["Returns"];

describe("Wave 39a — event_inventory.sample_qty", () => {
  it("Row includes sample_qty as a required number", () => {
    expectTypeOf<EventInventoryRow>().toHaveProperty("sample_qty").toEqualTypeOf<number>();
  });

  it("Insert allows sample_qty as optional (defaults to 0 in SQL)", () => {
    expectTypeOf<EventInventoryInsert>().toHaveProperty("sample_qty");
    // sample_qty is optional on Insert (server provides default 0).
    const sampleInsertWithout: EventInventoryInsert = {
      workspace_id: "00000000-0000-0000-0000-000000000000",
      event_id: "00000000-0000-0000-0000-000000000000",
      product_id: "00000000-0000-0000-0000-000000000000",
    };
    const sampleInsertWith: EventInventoryInsert = {
      ...sampleInsertWithout,
      sample_qty: 0,
    };
    expect(sampleInsertWithout.sample_qty).toBeUndefined();
    expect(sampleInsertWith.sample_qty).toBe(0);
  });
});

describe("Wave 39a — convert_event_to_sample RPC type", () => {
  it("Args require event id, product id, qty; reason is optional", () => {
    expectTypeOf<ConvertArgs>().toHaveProperty("p_event_id").toEqualTypeOf<string>();
    expectTypeOf<ConvertArgs>().toHaveProperty("p_product_id").toEqualTypeOf<string>();
    expectTypeOf<ConvertArgs>().toHaveProperty("p_qty").toEqualTypeOf<number>();
  });

  it("Returns the updated event_inventory row shape (including sample_qty)", () => {
    expectTypeOf<ConvertReturns>().toMatchTypeOf<EventInventoryRow>();
    expectTypeOf<ConvertReturns>().toHaveProperty("sample_qty").toEqualTypeOf<number>();
  });

  it("Args reason field accepts string, null, or undefined", () => {
    const a: ConvertArgs = {
      p_event_id: "x",
      p_product_id: "y",
      p_qty: 1,
    };
    const b: ConvertArgs = { ...a, p_reason: "smoke" };
    const c: ConvertArgs = { ...a, p_reason: null };
    expect([a, b, c].length).toBe(3);
  });
});

describe("Wave 39a — convert_sample_to_event RPC type", () => {
  it("matches the convert_event_to_sample signature (mirror function)", () => {
    expectTypeOf<ConvertBackArgs>().toEqualTypeOf<ConvertArgs>();
    expectTypeOf<ConvertBackReturns>().toEqualTypeOf<ConvertReturns>();
  });
});
