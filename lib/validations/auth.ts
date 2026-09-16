import { z } from "zod";
import { MALAWI_DISTRICTS } from "@/types";

const email = z
  .string()
  .trim()
  .email("Enter a valid email")
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z
  .object({
    accountType: z.enum(["individual", "dealer"]),
    name: z.string().trim().min(2, "Enter your name").max(80),
    email,
    password,
    phone: z.string().trim().min(8, "Enter a valid phone number"),
    dealerName: z.string().trim().optional().default(""),
    dealerPhone: z.string().trim().optional().default(""),
    whatsapp: z.string().trim().optional().default(""),
    districts: z.array(z.enum(MALAWI_DISTRICTS)).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.accountType !== "dealer") return;

    if (data.dealerName.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["dealerName"],
        message: "Enter the business name",
      });
    }
    if (data.dealerPhone.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["dealerPhone"],
        message: "Enter a valid business phone number",
      });
    }
    if (data.whatsapp.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message: "Enter a valid WhatsApp number",
      });
    }
    if (data.districts.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["districts"],
        message: "Select at least one district",
      });
    }
  });

export const resendVerificationSchema = z.object({
  email,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  email,
  token: z.string().min(1, "Reset link is missing"),
  password,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.output<typeof signUpSchema>;
export type SignUpInput = z.input<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
