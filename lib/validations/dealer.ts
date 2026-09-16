import { z } from "zod";
import { MALAWI_DISTRICTS } from "@/types";

export const dealerProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the dealership name").max(80),
  phone: z.string().trim().min(8, "Enter a valid phone number").max(30),
  whatsapp: z.string().trim().min(8, "Enter a valid WhatsApp number").max(30),
  description: z.string().trim().max(2000),
  logoUrl: z.string().nullable().optional(),
  districts: z
    .array(z.enum(MALAWI_DISTRICTS))
    .min(1, "Select at least one district"),
});

export const dealerListingStatusSchema = z.object({
  status: z.enum(["active", "sold", "draft", "expired"]),
});

export const dealerListingBulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Select at least one listing"),
  action: z.enum(["sold", "delete"]),
});

export const dealerListingPatchSchema = z.object({
  status: z.enum(["active", "sold", "draft", "expired"]).optional(),
  featured: z.boolean().optional(),
  days: z.union([z.literal(7), z.literal(14), z.literal(30)]).optional(),
});

export type DealerProfileValues = z.output<typeof dealerProfileSchema>;
