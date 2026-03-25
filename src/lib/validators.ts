import { z } from "zod";

// India-only: accept exactly 10 digits (no country code needed)
const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile starts 6-9

function normalizePhone(raw: string) {
  // Strip spaces, dashes, and leading +91 or 0
  const digits = raw.replace(/[\s\-]/g, "").replace(/^(\+91|91|0)/, "");
  return digits;
}

export const PhoneSchema = z.object({
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(
      z
        .string()
        .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number")
    ),
  remember: z.boolean().optional(),
});

export const SignupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(
      z
        .string()
        .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number")
    ),
  remember: z.boolean().optional(),
});

export const OtpSchema = z.object({
  otp: z.string().min(4, "Enter OTP").max(8, "OTP too long"),
});