"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, signInWithGoogle } from "@/lib/firebase/auth";
import { signUpSchema, SignUpInput } from "@/lib/validations/auth";
import { toast } from "sonner";
import { Dumbbell, Mail, Lock, User, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (data: SignUpInput) => {
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.displayName, data.phoneNumber);
      router.replace("/onboarding");
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "Email already in use"
          : "Failed to create account. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/onboarding");
    } catch {
      toast.error("Failed to sign up with Google. Try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const isAnyLoading = loading || googleLoading;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-x-hidden">
      {/* Subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)"
      }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-12 min-h-screen">
        {/* Logo */}
        <div className="mb-7 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-5">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-sans text-3xl font-black tracking-tight text-white">NoteFit</h1>
          <p className="text-white/40 text-sm mt-1.5 font-medium">Start your fitness journey today</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm animate-slide-up">
          <div className="bg-[#111111] border border-white/[0.08] rounded-3xl p-7 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-bold mb-1 text-white">Create account</h2>
            <p className="text-white/40 text-sm mb-7">Join thousands of athletes crushing goals</p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    {...register("displayName")}
                    type="text"
                    placeholder="Your Name"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-200"
                  />
                </div>
                {errors.displayName && (
                  <p className="text-red-400 text-xs">{errors.displayName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs">{errors.email.message}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">
                  Mobile Number <span className="normal-case text-white/25 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    {...register("phoneNumber")}
                    type="tel"
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-200"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-red-400 text-xs">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all duration-200"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isAnyLoading}
                className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-1 shadow-[0_4px_24px_rgba(255,255,255,0.12)]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-white/[0.06]" />
              <span className="px-3 text-[11px] text-white/30 uppercase tracking-widest font-medium">or</span>
              <div className="flex-1 border-t border-white/[0.06]" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
              className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 text-sm disabled:opacity-40 active:scale-[0.98]"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-white/40">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-semibold hover:text-white/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
