import { z } from "zod";
import { BODY_TYPES, FUEL_TYPES } from "@/types";

export const adminListingActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mute"),
    reason: z
      .string()
      .trim()
      .min(1, "Enter a reason for muting this listing.")
      .max(500, "Keep the reason under 500 characters."),
  }),
  z.object({ action: z.literal("unmute") }),
  z.object({ action: z.literal("delete") }),
  z.object({
    action: z.literal("feature"),
    days: z.union([z.literal(7), z.literal(14), z.literal(30)]).optional(),
  }),
  z.object({ action: z.literal("unfeature") }),
]);

export type AdminListingAction = z.output<typeof adminListingActionSchema>;

export const adminUserActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    reason: z
      .string()
      .trim()
      .min(1, "Enter a reason for suspending this account.")
      .max(500, "Keep the reason under 500 characters."),
  }),
  z.object({ action: z.literal("reactivate") }),
  z.object({ action: z.literal("verifyDealer") }),
  z.object({ action: z.literal("unverifyDealer") }),
  z.object({ action: z.literal("sendPasswordReset") }),
]);

export type AdminUserAction = z.output<typeof adminUserActionSchema>;

const catalogName = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(80, "Keep the name under 80 characters.");

const optionalParentId = z
  .union([z.string().uuid(), z.literal(""), z.literal("none"), z.null()])
  .optional()
  .transform((value) => {
    if (!value || value === "none" || value === "") return null;
    return value;
  });

const sortOrderSchema = z.coerce
  .number({ error: "Enter a sort order." })
  .int({ error: "Sort order must be a whole number." })
  .min(0)
  .max(10_000)
  .optional();

export const catalogMuteSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("indefinite") }),
  z.object({
    mode: z.literal("until"),
    until: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  }),
]);

export const adminCategoryCreateSchema = z.object({
  name: catalogName,
  parentId: optionalParentId,
  sortOrder: sortOrderSchema,
});

export const adminCategoryPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    name: catalogName,
    parentId: optionalParentId,
    sortOrder: sortOrderSchema,
  }),
  z.object({ action: z.literal("delete") }),
  z.object({ action: z.literal("mute"), mute: catalogMuteSchema }),
  z.object({ action: z.literal("unmute") }),
]);

export const adminMakeCreateSchema = z.object({
  name: catalogName,
  isPopular: z.boolean().optional(),
});

export const adminMakePatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    name: catalogName.optional(),
    isPopular: z.boolean().optional(),
  }),
  z.object({ action: z.literal("delete") }),
  z.object({ action: z.literal("mute"), mute: catalogMuteSchema }),
  z.object({ action: z.literal("unmute") }),
]);

export const adminModelCreateSchema = z.object({
  makeId: z.string().uuid(),
  name: catalogName,
  bodyType: z.enum(BODY_TYPES),
});

export const adminModelPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    name: catalogName.optional(),
    bodyType: z.enum(BODY_TYPES).optional(),
    makeId: z.string().uuid().optional(),
  }),
  z.object({ action: z.literal("delete") }),
  z.object({ action: z.literal("mute"), mute: catalogMuteSchema }),
  z.object({ action: z.literal("unmute") }),
]);

export const adminVariantCreateSchema = z.object({
  modelId: z.string().uuid(),
  name: catalogName,
  fuelType: z.enum(FUEL_TYPES).optional(),
});

export const adminVariantPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    name: catalogName.optional(),
    fuelType: z.enum(FUEL_TYPES).optional(),
  }),
  z.object({ action: z.literal("delete") }),
]);

export type CatalogMuteInput = z.output<typeof catalogMuteSchema>;
