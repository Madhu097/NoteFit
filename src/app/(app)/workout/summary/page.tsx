"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWorkout } from "@/lib/firebase/firestore";
import { getExercises } from "@/lib/firebase/firestore";
import { Workout } from "@/types/workout";
import { Exercise } from "@/types/workout";
import { Trophy, Clock, Dumbbell, TrendingUp, Home, RotateCcw, Flame } from "lucide-react";
import { formatDuration, formatVolume } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

function WorkoutSummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workoutId = searchParams.get("id");

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workoutId) return;
    Promise.all([getWorkout(workoutId), getExercises(workoutId)])
      .then(([w, ex]) => {
        setWorkout(w);
        setExercises(ex);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load workout summary (offline):", err);
        setLoading(false);
      });
  }, [workoutId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gym-border border-t-neon-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!workout) return null;

  const completedSets = exercises.reduce((total, ex) => total + ex.sets.filter(s => s.completed).length, 0);
  const totalSets = exercises.reduce((total, ex) => total + ex.sets.length, 0);

  return (
    <div className="page-container min-h-screen flex flex-col items-center">
      {/* Trophy animation */}
      <div className="mt-8 mb-6 flex flex-col items-center animate-scale-in">
        <div className="w-24 h-24 rounded-3xl bg-neon-green/10 border-2 border-neon-green/30 flex items-center justify-center mb-4 animate-glow-pulse">
          <Trophy className="w-12 h-12 text-neon-green" />
        </div>
        <h1 className="font-display text-3xl font-black text-gradient">Workout Complete!</h1>
        <p className="text-muted-foreground text-sm mt-2 capitalize">
          {workout.split?.replace("_", " ")} Day — Great work! 🔥
        </p>
      </div>

      {/* Stats grid */}
      <div className="w-full grid grid-cols-2 gap-3 mb-6 animate-fade-in">
        <div className="stat-card items-center">
          <Clock className="w-5 h-5 text-neon-blue mb-1" />
          <p className="font-display text-2xl font-black text-neon-blue">{formatDuration(workout.duration || 1)}</p>
          <p className="text-muted-foreground text-xs">Duration</p>
        </div>
        <div className="stat-card items-center">
          <Dumbbell className="w-5 h-5 text-neon-green mb-1" />
          <p className="font-display text-2xl font-black text-neon-green">{exercises.length}</p>
          <p className="text-muted-foreground text-xs">Exercises</p>
        </div>
        <div className="stat-card items-center">
          <TrendingUp className="w-5 h-5 text-pr-gold mb-1" />
          <p className="font-display text-2xl font-black text-pr-gold">{formatVolume(workout.totalVolume || 0)}</p>
          <p className="text-muted-foreground text-xs">Total Volume</p>
        </div>
        <div className="stat-card items-center">
          <Flame className="w-5 h-5 text-orange-400 mb-1" />
          <p className="font-display text-2xl font-black text-orange-400">
            {completedSets}/{totalSets}
          </p>
          <p className="text-muted-foreground text-xs">Sets Done</p>
        </div>
      </div>

      {/* Exercise breakdown */}
      {exercises.length > 0 && (
        <div className="w-full mb-6 animate-fade-in">
          <h3 className="section-heading">Exercise Summary</h3>
          <div className="flex flex-col gap-2">
            {exercises.map((ex) => {
              const volume = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
              return (
                <div key={ex.id} className="glass-card px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{ex.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {ex.sets.length} sets · {ex.sets[0]?.weight ?? 0}kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-neon-green text-sm font-bold">{formatVolume(volume)}</p>
                    <p className="text-muted-foreground text-xs">volume</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="w-full flex flex-col gap-3 mb-8 animate-slide-up">
        <Link href="/dashboard" className="neon-btn w-full py-4 flex items-center justify-center gap-2 font-bold">
          <Home className="w-5 h-5" /> Back to Dashboard
        </Link>
        <Link
          href="/workout"
          className="w-full py-3 rounded-xl border border-gym-border text-muted-foreground hover:text-foreground hover:border-gym-muted flex items-center justify-center gap-2 text-sm font-medium transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Start Another Workout
        </Link>
      </div>
    </div>
  );
}

export default function WorkoutSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gym-border border-t-neon-green rounded-full animate-spin" />
      </div>
    }>
      <WorkoutSummaryContent />
    </Suspense>
  );
}
