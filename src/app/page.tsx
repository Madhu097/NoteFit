"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (profile && !profile.onboardingComplete) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen bg-gym-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center animate-glow-pulse">
            <span className="text-4xl">⚡</span>
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-black text-gradient">NoteFit</h1>
          <p className="text-muted-foreground text-sm mt-1">Track Every Rep. Beat Every Workout.</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-neon-green animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
