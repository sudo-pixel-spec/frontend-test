"use client";

import AuthShell from "@/components/auth/AuthShell";
import GlassCard from "@/components/auth/GlassCard";
import AuthInput from "@/components/auth/AuthInput";
import PrimaryButton from "@/components/auth/PrimaryButton";
import Divider from "@/components/auth/Divider";
import SocialButton from "@/components/auth/SocialButton";
import { Mail, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmailSchema, OtpSchema } from "@/lib/validators";
import { z } from "zod";
import { requestOtp, verifyOtp, googleSignIn } from "@/lib/auth.service";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store"; // ✅ persisted Zustand token store

type EmailForm = z.infer<typeof EmailSchema>;
type OtpForm = z.infer<typeof OtpSchema>;

function nextRoute(user: { role: "learner" | "admin"; profileComplete?: boolean }) {
  if (user.role === "admin") return "/admin";
  return user.profileComplete ? "/dashboard" : "/profile/setup/step-1";
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth); // ✅ store token in persisted state
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(EmailSchema),
    defaultValues: { email: "", remember: true },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: "" },
  });

  async function onRequestOtp(values: EmailForm) {
    try {
      await requestOtp(values.email);
      setEmail(values.email);
      setStage("otp");
      toast.success("OTP sent. Check your email.");
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP");
    }
  }

  async function onVerifyOtp(values: OtpForm) {
    try {
      const res = await verifyOtp(email, values.otp);

      // ✅ Save access token where the API client reads it (Zustand persisted)
      if (!res?.accessToken) throw new Error("Missing access token");
      setAuth(res.accessToken);

      toast.success("Logged in!");
      router.replace(nextRoute(res.user));
    } catch (e: any) {
      toast.error(e.message || "Invalid OTP");
    }
  }

  return (
    <AuthShell>
      <GlassCard>
        <div className="space-y-4">
          {stage === "email" ? (
            <form className="space-y-4" onSubmit={emailForm.handleSubmit(onRequestOtp)}>
              <AuthInput
                label="Email or Username"
                placeholder="Enter your email or username"
                icon={<Mail size={16} />}
                error={emailForm.formState.errors.email?.message}
                inputProps={{
                  ...emailForm.register("email"),
                  autoComplete: "email",
                }}
              />

              <label className="flex items-center gap-2 text-xs text-white/60 select-none">
                <input
                  type="checkbox"
                  className="accent-orange-500"
                  {...emailForm.register("remember")}
                />
                Keep me logged in
              </label>

              <PrimaryButton type="submit" loading={emailForm.formState.isSubmitting}>
                Login
              </PrimaryButton>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={otpForm.handleSubmit(onVerifyOtp)}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  OTP sent to <span className="text-white/85">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStage("email")}
                  className="text-xs text-orange-400 hover:text-orange-300 transition"
                >
                  Change
                </button>
              </div>

              <AuthInput
                label="OTP"
                placeholder="••••••"
                type="password"
                icon={<Lock size={16} />}
                error={otpForm.formState.errors.otp?.message}
                inputProps={{
                  ...otpForm.register("otp"),
                  inputMode: "numeric",
                  autoComplete: "one-time-code",
                }}
              />

              <PrimaryButton type="submit" loading={otpForm.formState.isSubmitting}>
                Verify & Continue
              </PrimaryButton>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await requestOtp(email);
                    toast.success("OTP resent.");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to resend OTP");
                  }
                }}
                className="w-full text-xs text-white/55 hover:text-white/75 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} />
                Resend OTP
              </button>
            </form>
          )}

          <Divider />

          <div className="flex gap-3">
            <div className="flex-1">
              <div className="opacity-0 pointer-events-none absolute" />
              <GoogleLogin
                onSuccess={async (cred) => {
                  try {
                    if (!cred.credential) throw new Error("Missing Google credential");
                    const res = await googleSignIn(cred.credential);

                    // ✅ Save access token in Zustand persisted store
                    if (!res?.accessToken) throw new Error("Missing access token");
                    setAuth(res.accessToken);

                    toast.success("Signed in with Google!");
                    router.replace(nextRoute(res.user));
                  } catch (e: any) {
                    toast.error(e.message || "Google sign-in failed");
                  }
                }}
                onError={() => toast.error("Google sign-in failed")}
                useOneTap={false}
                theme="filled_black"
                size="large"
                shape="pill"
                text="continue_with"
                width={240}
              />
            </div>

            <SocialButton label="Apple" onClick={() => toast("Apple sign-in coming soon")} />
          </div>

          <div className="pt-3 text-center text-xs text-white/50">
            Don&apos;t have an account yet?{" "}
            <Link className="text-orange-400 hover:text-orange-300 transition" href="/auth/signup">
              Join the Mission
            </Link>
          </div>
        </div>
      </GlassCard>
    </AuthShell>
  );
}