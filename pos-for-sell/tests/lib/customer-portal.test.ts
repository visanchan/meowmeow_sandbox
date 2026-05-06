import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  Database,
  PreferredContactMethod,
  ContactChannel,
  CustomerRegisteredVia,
  PetSpecies,
  CustomerOrderLinkSource,
  Json,
} from "@/lib/database.types";

// Type-level coverage for Wave 40a — Customer Portal data layer.
// The DB-side Postgres functions (create_registration_token,
// claim_registration_token) are exercised via integration tests when
// Supabase credentials are wired (currently blocked, see TASKS.md).
// Until then, these tests guard the type contract so server actions and
// portal pages can rely on it without a live DB.

type Tables = Database["public"]["Tables"];
type Customers = Tables["customers"]["Row"];
type Contacts = Tables["customer_contacts"]["Row"];
type Pets = Tables["pets"]["Row"];
type Links = Tables["customer_order_links"]["Row"];
type Tokens = Tables["customer_registration_tokens"]["Row"];
type CreateArgs =
  Database["public"]["Functions"]["create_registration_token"]["Args"];
type CreateReturns =
  Database["public"]["Functions"]["create_registration_token"]["Returns"];
type ClaimArgs =
  Database["public"]["Functions"]["claim_registration_token"]["Args"];
type ClaimReturns =
  Database["public"]["Functions"]["claim_registration_token"]["Returns"];

describe("Wave 40a — customers table type", () => {
  it("Row has the post-purchase profile shape", () => {
    expectTypeOf<Customers>().toHaveProperty("workspace_id").toEqualTypeOf<string>();
    expectTypeOf<Customers>().toHaveProperty("display_name").toEqualTypeOf<string | null>();
    expectTypeOf<Customers>()
      .toHaveProperty("preferred_contact_method")
      .toEqualTypeOf<PreferredContactMethod | null>();
    expectTypeOf<Customers>()
      .toHaveProperty("consent_marketing")
      .toEqualTypeOf<boolean>();
    expectTypeOf<Customers>()
      .toHaveProperty("registered_via")
      .toEqualTypeOf<CustomerRegisteredVia>();
  });

  it("Insert allows omitting all profile fields except workspace_id", () => {
    const minimal: Tables["customers"]["Insert"] = {
      workspace_id: "00000000-0000-0000-0000-000000000000",
    };
    expect(minimal.workspace_id).toBeTruthy();
    expect(minimal.display_name).toBeUndefined();
  });
});

describe("Wave 40a — customer_contacts type", () => {
  it("Row keys (channel, value) — used by the unique lookup index", () => {
    expectTypeOf<Contacts>().toHaveProperty("channel").toEqualTypeOf<ContactChannel>();
    expectTypeOf<Contacts>().toHaveProperty("value").toEqualTypeOf<string>();
    expectTypeOf<Contacts>().toHaveProperty("is_primary").toEqualTypeOf<boolean>();
  });

  it("ContactChannel enum covers phone / email / line / other", () => {
    const channels: ContactChannel[] = ["phone", "email", "line", "other"];
    expect(channels.length).toBe(4);
  });
});

describe("Wave 40a — pets type (vertical module)", () => {
  it("Row required fields: name, species (defaults to cat in SQL)", () => {
    expectTypeOf<Pets>().toHaveProperty("name").toEqualTypeOf<string>();
    expectTypeOf<Pets>().toHaveProperty("species").toEqualTypeOf<PetSpecies>();
    // Optional fields are typed as nullable.
    expectTypeOf<Pets>().toHaveProperty("breed").toEqualTypeOf<string | null>();
    expectTypeOf<Pets>().toHaveProperty("weight_kg").toEqualTypeOf<number | null>();
    expectTypeOf<Pets>().toHaveProperty("birthday").toEqualTypeOf<string | null>();
    expectTypeOf<Pets>().toHaveProperty("allergies").toEqualTypeOf<string | null>();
  });

  it("PetSpecies enum mirrors the schema CHECK constraint", () => {
    const species: PetSpecies[] = ["cat", "dog", "rabbit", "bird", "other"];
    expect(species.length).toBe(5);
  });
});

describe("Wave 40a — customer_order_links type (M:N bridge)", () => {
  it("Row links a customer to an order with provenance", () => {
    expectTypeOf<Links>().toHaveProperty("customer_id").toEqualTypeOf<string>();
    expectTypeOf<Links>().toHaveProperty("order_id").toEqualTypeOf<string>();
    expectTypeOf<Links>().toHaveProperty("linked_via").toEqualTypeOf<CustomerOrderLinkSource>();
  });
});

describe("Wave 40a — customer_registration_tokens type (one-shot)", () => {
  it("Row carries token + claim state", () => {
    expectTypeOf<Tokens>().toHaveProperty("token").toEqualTypeOf<string>();
    expectTypeOf<Tokens>().toHaveProperty("expires_at").toEqualTypeOf<string>();
    expectTypeOf<Tokens>().toHaveProperty("claimed_at").toEqualTypeOf<string | null>();
    expectTypeOf<Tokens>()
      .toHaveProperty("claimed_customer_id")
      .toEqualTypeOf<string | null>();
  });
});

describe("Wave 40a — create_registration_token RPC type", () => {
  it("Args = { p_order_id }, Returns = token string", () => {
    expectTypeOf<CreateArgs>().toHaveProperty("p_order_id").toEqualTypeOf<string>();
    expectTypeOf<CreateReturns>().toEqualTypeOf<string>();
  });
});

describe("Wave 40a — claim_registration_token RPC type", () => {
  it("Args = { p_token, p_payload }, Returns = customer id", () => {
    expectTypeOf<ClaimArgs>().toHaveProperty("p_token").toEqualTypeOf<string>();
    expectTypeOf<ClaimArgs>().toHaveProperty("p_payload").toEqualTypeOf<Json>();
    expectTypeOf<ClaimReturns>().toEqualTypeOf<string>();
  });

  it("Json payload accepts the documented shape", () => {
    const payload: Json = {
      customer: {
        display_name: "Pim",
        preferred_contact_method: "phone",
        consent_marketing: true,
      },
      contacts: [{ channel: "phone", value: "0800000000", is_primary: true }],
      pets: [
        {
          name: "Milo",
          species: "cat",
          breed: "Bombay",
          weight_kg: 4.2,
          birthday: "2022-03-04",
        },
      ],
    };
    const args: ClaimArgs = { p_token: "abc123def456ghi7", p_payload: payload };
    expect(args.p_token.length).toBeGreaterThan(8);
  });
});
