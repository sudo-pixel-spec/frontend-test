"use client";

import AuthShell from "@/components/auth/AuthShell";
import GlassCard from "@/components/auth/GlassCard";
import AuthInput from "@/components/auth/AuthInput";
import PrimaryButton from "@/components/auth/PrimaryButton";
import Divider from "@/components/auth/Divider";
import SocialButton from "@/components/auth/SocialButton";
import { Mail, User as UserIcon, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema, OtpSchema } from "@/lib/validators";
import { z } from "zod";
import { requestOtp, verifyOtp, googleSignIn } from "@/lib/auth.service";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useCooldown } from "@/lib/useCooldown";
import { useAuthStore } from "@/lib/auth.store"; // ✅ use persisted Zustand store

type SignupForm = z.infer<typeof SignupSchema>;
type OtpForm = z.infer<typeof OtpSchema>;

function nextRoute(user: { role: "learner" | "admin"; profileComplete?: boolean }) {
  if (user.role === "admin") return "/admin";
  return user.profileComplete ? "/dashboard" : "/profile/setup/step-1";
}

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth); // ✅ persisted access token
  const [stage, setStage] = useState<"signup" | "otp">("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const cooldown = useCooldown(30);

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { name: "", email: "", remember: true },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: "" },
  });

  const otpValue = otpForm.watch("otp");

  useEffect(() => {
    if (stage !== "otp") return;
    const t = setTimeout(() => {
      const el = document.getElementById("otp-input") as HTMLInputElement | null;
      el?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [stage]);

  async function onRequestOtp(values: SignupForm) {
    try {
      await requestOtp(values.email);
      setEmail(values.email);
      setName(values.name);
      setStage("otp");
      cooldown.start();
      toast.success("OTP sent. Check your email.");
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP");
    }
  }

  async function onVerifyOtp(values: OtpForm) {
    try {
      const res = await verifyOtp(email, values.otp);

      // ✅ Save access token in Zustand (persisted) so protected routes can read it
      if (!res?.accessToken) throw new Error("Missing access token");
      setAuth(res.accessToken);

      toast.success(`Welcome, ${name || "Learner"}!`);
      router.replace(nextRoute(res.user));
    } catch (e: any) {
      toast.error(e.message || "Invalid OTP");
    }
  }

  const resendLabel = useMemo(() => {
    if (!cooldown.running) return "Resend OTP";
    const mm = Math.floor(cooldown.left / 60);
    const ss = String(cooldown.left % 60).padStart(2, "0");
    return `Resend in ${mm}:${ss}`;
  }, [cooldown.left, cooldown.running]);

  return (
    <AuthShell>
      <GlassCard>
        <div className="space-y-4">
          {stage === "signup" ? (
            <form className="space-y-4" onSubmit={signupForm.handleSubmit(onRequestOtp)}>
              <AuthInput
                label="Full Name"
                placeholder="Enter your full name"
                icon={<UserIcon size={16} />}
                error={signupForm.formState.errors.name?.message}
                inputProps={{
                  ...signupForm.register("name"),
                  autoComplete: "name",
                }}
              />

              <AuthInput
                label="Email or Username"
                placeholder="Enter your email or username"
                icon={<Mail size={16} />}
                error={signupForm.formState.errors.email?.message}
                inputProps={{
                  ...signupForm.register("email"),
                  autoComplete: "email",
                  spellCheck: false,
                }}
              />

              <AuthInput
                label="Password"
                placeholder="Passwordless (OTP login)"
                type="password"
                allowReveal
                icon={<Lock size={16} />}
                inputProps={{
                  disabled: true,
                }}
              />

              <label className="flex items-center gap-2 text-xs text-white/60 select-none">
                <input type="checkbox" className="accent-orange-500" {...signupForm.register("remember")} />
                Keep me logged in
              </label>

              <PrimaryButton type="submit" loading={signupForm.formState.isSubmitting}>
                Sign Up
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
                  onClick={() => {
                    setStage("signup");
                    otpForm.reset({ otp: "" });
                  }}
                  className="text-xs text-orange-400 hover:text-orange-300 transition"
                >
                  Change
                </button>
              </div>

              <AuthInput
                label="OTP"
                placeholder="••••••"
                type="password"
                allowReveal
                icon={<Lock size={16} />}
                error={otpForm.formState.errors.otp?.message}
                inputProps={{
                  id: "otp-input",
                  ...otpForm.register("otp"),
                  inputMode: "numeric",
                  autoComplete: "one-time-code",
                  onPaste: (e) => {
                    const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
                    if (v) otpForm.setValue("otp", v, { shouldValidate: true });
                  },
                }}
              />

              <PrimaryButton
                type="submit"
                loading={otpForm.formState.isSubmitting}
                disabled={!otpValue || otpValue.length < 4}
              >
                Verify & Continue
              </PrimaryButton>

              <button
                type="button"
                disabled={cooldown.running}
                onClick={async () => {
                  try {
                    await requestOtp(email);
                    cooldown.start();
                    toast.success("OTP resent.");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to resend OTP");
                  }
                }}
                className={[
                  "w-full text-xs transition flex items-center justify-center gap-2",
                  cooldown.running ? "text-white/35 cursor-not-allowed" : "text-white/55 hover:text-white/75",
                ].join(" ")}
              >
                <CheckCircle2 size={14} />
                {resendLabel}
              </button>
            </form>
          )}

          <Divider />

          <div className="flex gap-3">
            <div className="flex-1">
              <GoogleLogin
                onSuccess={async (cred) => {
                  try {
                    if (!cred.credential) throw new Error("Missing Google credential");
                    const res = await googleSignIn(cred.credential);

                    // ✅ Save access token in Zustand (persisted)
                    if (!res?.accessToken) throw new Error("Missing access token");
                    setAuth(res.accessToken);

                    toast.success("Signed up with Google!");
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
            Already have an account?{" "}
            <Link className="text-orange-400 hover:text-orange-300 transition" href="/auth/login">
              Login
            </Link>
          </div>
        </div>
      </GlassCard>
    </AuthShell>
  );
}