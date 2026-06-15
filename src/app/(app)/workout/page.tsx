"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkouts } from "@/hooks/useWorkouts";
import { WorkoutSplit, WORKOUT_SPLITS } from "@/types/workout";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export default function WorkoutPage() {
  const router = useRouter();
  const { addWorkout } = useWorkouts();
  const [selected, setSelected] = useState<WorkoutSplit | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const id = await addWorkout({
        date: new Date() as any,
        split: selected,
        duration: 0,
        notes: "",
        exerciseCount: 0,
        totalVolume: 0,
      });
      if (id) {
        router.push(`/workout/session?id=${id}`);
      }
    } catch {
      toast.error("Failed to start workout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-gym-charcoal border border-gym-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black">Start Workout</h1>
          <p className="text-muted-foreground text-sm">Choose your training split</p>
        </div>
      </div>

      {/* Split grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {WORKOUT_SPLITS.map((split) => (
          <button
            key={split.value}
            onClick={() => setSelected(split.value)}
            className={cn(
              "split-card border-2 p-5 transition-all duration-200",
              selected === split.value
                ? "border-neon-green/60 bg-neon-green/5 shadow-[0_0_20px_rgba(57,255,20,0.1)]"
                : "border-gym-border hover:border-gym-muted"
            )}
          >
            <span className="text-4xl mb-1">{split.icon}</span>
            <span className="font-display font-bold text-base">{split.label}</span>
            {selected === split.value && (
              <span className="badge-green text-[10px] mt-1">Selected ✓</span>
            )}
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className="neon-btn w-full py-4 flex items-center justify-center gap-2 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Begin{selected ? ` ${WORKOUT_SPLITS.find(s => s.value === selected)?.label}` : ""} Workout
          </>
        )}
      </button>
    </div>
  );
}
