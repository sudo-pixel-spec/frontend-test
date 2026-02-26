import { z } from "zod";

export const EmailSchema = z.object({
  email: z.string().email("Enter a valid email"),
  remember: z.boolean().optional(),
});

export const SignupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  remember: z.boolean().optional(),
});

export const OtpSchema = z.object({
  otp: z.string().min(4, "Enter OTP").max(8, "OTP too long"),
});