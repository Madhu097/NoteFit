"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, signInWithGoogle } from "@/lib/firebase/auth";
import { signInSchema, SignInInput } from "@/lib/validations/auth";
import { toast } from "sonner";
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowRight, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (data: SignInInput) => {
    setLoading(true);
    try {
      await signIn(data.identifier, data.password);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential" || err.message === "auth/user-not-found"
          ? "Invalid email, mobile number or password"
          : "Failed to sign in. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error("Failed to sign in with Google. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col relative overflow-x-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
            <Dumbbell className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="font-display text-4xl font-black text-gradient">NoteFit</h1>
          <p className="text-muted-foreground text-sm mt-1">Track Every Rep. Beat Every Workout.</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm glass-card p-6 animate-slide-up">
          <h2 className="text-xl font-bold mb-6 text-foreground">Welcome back</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email or Mobile Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground font-medium">Email or Mobile Number</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register("identifier")}
                  type="text"
                  placeholder="you@example.com or +919876543210"
                  className="w-full pl-10 pr-4 py-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green/50 transition-colors"
                />
              </div>
              {errors.identifier && (
                <p className="text-destructive text-xs">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="neon-btn w-full py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gym-border"></div>
            <span className="px-3 text-xs text-muted-foreground uppercase tracking-wider">Or</span>
            <div className="flex-1 border-t border-gym-border"></div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-gym-charcoal hover:bg-gym-charcoal/80 border border-gym-border text-foreground font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5 flex-none" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-neon-green font-semibold hover:underline">
              Sign up free
            </Link>
          </p>

          <div className="mt-8 text-center border-t border-gym-border/40 pt-4">
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                toast.success("All local data deleted. App reset successfully!");
                setTimeout(() => window.location.reload(), 500);
              }}
              className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors font-medium"
            >
              Reset App Data (Clear All Local Users & Databases)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
