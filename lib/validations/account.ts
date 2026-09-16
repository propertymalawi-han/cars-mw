import { z } from "zod";
import { NOTIFICATION_KEYS } from "@/lib/notification-preferences";

const email = z
  .string()
  .trim()
  .email("Enter a valid email")
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email,
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((value) => value === "" || value.replace(/\D/g, "").length >= 8, {
      message: "Enter a valid phone number",
    }),
  avatarUrl: z.string().nullable().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    password,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const enquirySchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().trim().min(10, "Write a short message").max(2000),
});

export const enquiryMessageSchema = z.object({
  body: z.string().trim().min(1, "Write a message").max(2000),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["pending", "replied", "closed"]),
});

export const reviewSchema = z.object({
  dealerId: z.string().uuid(),
  rating: z.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().trim().max(2000).optional().default(""),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().trim().max(2000).optional().default(""),
});

export const notificationPreferenceSchema = z.object({
  key: z.enum(NOTIFICATION_KEYS),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
});

export const favouriteSchema = z.object({
  listingId: z.string().uuid(),
});

export const viewHistorySchema = z.object({
  listingId: z.string().uuid(),
});

export const accountListingPatchSchema = z
  .object({
    status: z.literal("sold").optional(),
    renew: z.literal(true).optional(),
  })
  .refine((data) => data.status === "sold" || data.renew === true, {
    message: "Choose an action for this listing.",
  });

export type ProfileValues = z.output<typeof profileSchema>;
export type ChangePasswordValues = z.output<typeof changePasswordSchema>;
export type EnquiryValues = z.output<typeof enquirySchema>;
export type ReviewValues = z.output<typeof reviewSchema>;
