"use client";

import AuthShell from "@/components/auth/AuthShell";
import GlassCard from "@/components/auth/GlassCard";
import AuthInput from "@/components/auth/AuthInput";
import PrimaryButton from "@/components/auth/PrimaryButton";
import Divider from "@/components/auth/Divider";
import { Phone, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { OtpSchema } from "@/lib/validators";
import { requestOtp, verifyOtp, googleSignIn } from "@/lib/auth.service";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useCooldown } from "@/lib/useCooldown";

function normalizePhone(raw: string) {
  const d = raw.replace(/[\s\-]/g, "").replace(/^(\+91|91|0)/, "");
  return `+91${d}`;
}
function isValidIndianPhone(raw: string) {
  const d = raw.replace(/[\s\-]/g, "").replace(/^(\+91|91|0)/, "");
  return /^[6-9]\d{9}$/.test(d);
}

type Stage = "phone" | "otp";

function nextRoute(user: { role: "learner" | "admin"; profileComplete?: boolean; onboardingComplete?: boolean }) {
  if (user.role === "admin") return "/admin";
  if (!user.onboardingComplete && !user.profileComplete) return "/onboarding";
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [otpErr, setOtpErr] = useState("");
  const [loading, setLoading] = useState(false);
  const cooldown = useCooldown(30);

  function validatePhone() {
    if (!isValidIndianPhone(phone)) {
      setPhoneErr("Enter a valid 10-digit Indian mobile number");
      return false;
    }
    setPhoneErr(""); return true;
  }

  async function handleRequestOtp() {
    if (!validatePhone()) return;
    setLoading(true);
    try {
      await requestOtp(normalizePhone(phone));
      setStage("otp");
      cooldown.start();
      toast.success("OTP sent to your phone!");
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP");
    } finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    const result = OtpSchema.shape.otp.safeParse(otp.trim());
    if (!result.success) { setOtpErr(result.error.issues[0].message); return; }
    setOtpErr("");
    setLoading(true);
    try {
      const res = await verifyOtp(normalizePhone(phone), otp.trim());
      if (!res?.accessToken) throw new Error("Missing access token");
      setAuth(res.accessToken, res.user);
      toast.success("Welcome back! 🎉");
      router.replace(nextRoute(res.user));
    } catch (e: any) {
      setOtpErr(e.message || "Invalid OTP");
      toast.error(e.message || "Invalid OTP");
    } finally { setLoading(false); }
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
        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-black text-white">Welcome back 👋</h2>
          <p className="text-sm text-white/40">Sign in with your phone number</p>
        </div>

        <div className="space-y-4">
          {stage === "phone" ? (
            <div className="space-y-4">
              <AuthInput
                label="Phone Number"
                placeholder="98765 43210"
                icon={<Phone size={16} />}
                error={phoneErr}
                inputProps={{
                  value: phone,
                  onChange: (e) => setPhone(e.target.value.replace(/[^0-9\s\-]/g, "").slice(0, 12)),
                  onKeyDown: (e) => e.key === "Enter" && handleRequestOtp(),
                  autoComplete: "tel",
                  type: "tel",
                  inputMode: "numeric",
                }}
              />
              <PrimaryButton onClick={handleRequestOtp} loading={loading}>
                Send OTP
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  OTP sent to <span className="text-white/85">{phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setStage("phone"); setOtp(""); setOtpErr(""); }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                >
                  Change
                </button>
              </div>

              <AuthInput
                label="Enter OTP"
                placeholder="••••••"
                type="password"
                allowReveal
                icon={<Lock size={16} />}
                error={otpErr}
                inputProps={{
                  id: "otp-input",
                  value: otp,
                  onChange: (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8)),
                  onKeyDown: (e) => e.key === "Enter" && handleVerifyOtp(),
                  inputMode: "numeric",
                  autoComplete: "one-time-code",
                  onPaste: (e) => {
                    const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
                    if (v) setOtp(v);
                  },
                }}
              />

              <PrimaryButton onClick={handleVerifyOtp} loading={loading} disabled={otp.length < 4}>
                Verify & Sign In
              </PrimaryButton>

              <button
                type="button"
                disabled={cooldown.running || loading}
                onClick={async () => {
                  try {
                    await requestOtp(normalizePhone(phone));
                    cooldown.start();
                    toast.success("OTP resent!");
                  } catch (e: any) { toast.error(e.message || "Failed to resend"); }
                }}
                className={[
                  "w-full text-xs transition flex items-center justify-center gap-2",
                  cooldown.running ? "text-white/30 cursor-not-allowed" : "text-white/55 hover:text-white/75",
                ].join(" ")}
              >
                <CheckCircle2 size={14} />
                {resendLabel}
              </button>
            </div>
          )}

          <Divider />

          <GoogleLogin
            onSuccess={async (cred) => {
              try {
                if (!cred.credential) throw new Error("Missing Google credential");
                const res = await googleSignIn(cred.credential);
                if (!res?.accessToken) throw new Error("Missing access token");
                setAuth(res.accessToken, res.user);
                toast.success("Signed in with Google!");
                router.replace(nextRoute(res.user));
              } catch (e: any) { toast.error(e.message || "Google sign-in failed"); }
            }}
            onError={() => toast.error("Google sign-in failed")}
            useOneTap={false}
            theme="filled_black"
            size="large"
            shape="pill"
            text="continue_with"
            width={340}
          />

          <div className="pt-2 text-center text-xs text-white/50">
            New here?{" "}
            <Link className="text-cyan-400 hover:text-cyan-300 transition font-semibold" href="/auth/signup">
              Create an account
            </Link>
          </div>
        </div>
      </GlassCard>
    </AuthShell>
  );
}