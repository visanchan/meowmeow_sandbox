import { z } from "zod";

const phoneRe = /^[0-9+\-\s()]{6,}$/;

export const RegisterFormSchema = z.object({
  displayName: z.string().trim().max(80).optional(),
  preferredContactMethod: z
    .enum(["phone", "email", "line"])
    .optional()
    .nullable(),
  consentMarketing: z.boolean().default(false),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || phoneRe.test(v), {
      message: "Phone looks wrong",
    })
    .optional()
    .default(""),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email looks wrong",
    })
    .optional()
    .default(""),
  lineId: z.string().trim().max(80).optional().default(""),
  pet: z
    .object({
      name: z.string().trim().max(40).default(""),
      species: z
        .enum(["cat", "dog", "rabbit", "bird", "other"])
        .default("cat"),
      breed: z.string().trim().max(80).optional().default(""),
      birthday: z.string().trim().optional().default(""),
      allergies: z.string().trim().max(200).optional().default(""),
      preferences: z.string().trim().max(200).optional().default(""),
    })
    .optional()
    .default({
      name: "",
      species: "cat",
      breed: "",
      birthday: "",
      allergies: "",
      preferences: "",
    }),
});

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;
