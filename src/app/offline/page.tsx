"use client";

import React, { useState } from "react";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OfflinePage() {
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  const handleRetry = () => {
    setChecking(true);
    
    // Simulate connection check
    setTimeout(() => {
      setChecking(false);
      if (typeof window !== "undefined") {
        if (navigator.onLine) {
          toast.success("You are back online!");
          router.refresh();
          router.push("/dashboard");
        } else {
          toast.error("Still offline. Please check your internet connection.");
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 text-center">
      {/* Glow decorative effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-neon-green/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card max-w-md w-full p-8 flex flex-col items-center gap-6 animate-scale-up border-gym-border/60 relative z-10">
        <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center animate-pulse">
          <WifiOff className="w-8 h-8 text-neon-green" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
            Connection Lost
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
            NoteFit is offline. We'll automatically save your training sessions locally and sync them when you're back online.
          </p>
        </div>

        <div className="w-full space-y-3 pt-2">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="neon-btn w-full py-3 flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Verifying..." : "Retry Connection"}
          </button>
          
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 bg-gym-charcoal hover:bg-gym-muted/30 border border-gym-border text-muted-foreground hover:text-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
