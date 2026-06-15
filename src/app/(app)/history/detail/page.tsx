"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { getWorkout, getExercises } from "@/lib/firebase/firestore";
import { Workout } from "@/types/workout";
import { Exercise } from "@/types/workout";
import { ArrowLeft, Clock, Dumbbell, TrendingUp, FileText, Trash2 } from "lucide-react";
import { formatWorkoutDate, formatDuration, formatVolume, getSplitBg } from "@/lib/utils";
import { useWorkouts } from "@/hooks/useWorkouts";
import Link from "next/link";

function WorkoutDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { removeWorkout } = useWorkouts();
  const workoutId = (params?.id as string) || (searchParams?.get("id") as string);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workoutId) {
      Promise.all([getWorkout(workoutId), getExercises(workoutId)])
        .then(([w, ex]) => {
          setWorkout(w);
          setExercises(ex);
          setLoading(false);
        })
        .catch((err) => {
          console.warn("Failed to load workout details (offline):", err);
          setLoading(false);
        });
    }
  }, [workoutId]);

  const handleDelete = async () => {
    if (!workoutId) return;
    if (!confirm("Delete this workout?")) return;
    await removeWorkout(workoutId);
    router.replace("/history");
  };

  if (!workoutId) {
    return (
      <div className="page-container py-12 text-center text-muted-foreground">
        No workout selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-20 shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!workout) return null;

  return (
    <div className="page-container min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="w-9 h-9 rounded-xl bg-gym-charcoal border border-gym-border flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-black capitalize">
              {workout.split.replace("_", " ")} Day
            </h1>
            <p className="text-muted-foreground text-sm">{formatWorkoutDate(workout.date)}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="w-9 h-9 rounded-xl border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat-card items-center">
          <Clock className="w-4 h-4 text-neon-blue mb-1" />
          <p className="font-display text-lg font-black text-neon-blue">{formatDuration(workout.duration)}</p>
          <p className="text-muted-foreground text-[10px]">Duration</p>
        </div>
        <div className="stat-card items-center">
          <Dumbbell className="w-4 h-4 text-neon-green mb-1" />
          <p className="font-display text-lg font-black text-neon-green">{exercises.length}</p>
          <p className="text-muted-foreground text-[10px]">Exercises</p>
        </div>
        <div className="stat-card items-center">
          <TrendingUp className="w-4 h-4 text-pr-gold mb-1" />
          <p className="font-display text-lg font-black text-pr-gold">{formatVolume(workout.totalVolume)}</p>
          <p className="text-muted-foreground text-[10px]">Volume</p>
        </div>
      </div>

      {/* Split badge */}
      <div className="mb-4">
        <span className={`text-xs px-2.5 py-1 rounded-full border ${getSplitBg(workout.split)} font-semibold`}>
          {workout.split.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Exercises */}
      <h3 className="section-heading mb-3">Exercises</h3>
      <div className="flex flex-col gap-3 mb-6">
        {exercises.map((ex, idx) => (
          <div key={ex.id} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-xs font-bold flex-none">
                {idx + 1}
              </div>
              <h4 className="font-semibold text-sm">{ex.name}</h4>
            </div>
            <div className="grid grid-cols-[28px_1fr_1fr_1fr] gap-2 text-[10px] text-muted-foreground font-semibold px-1 mb-2">
              <span>Set</span>
              <span className="text-center">Weight</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Rest</span>
            </div>
            {ex.sets.map((set, i) => (
              <div key={i} className="grid grid-cols-[28px_1fr_1fr_1fr] gap-2 text-sm py-1.5 border-b border-gym-border/50 last:border-0">
                <span className="text-muted-foreground text-xs font-bold">{i + 1}</span>
                <span className="text-center font-semibold">{set.weight}kg</span>
                <span className="text-center text-muted-foreground">{set.reps}</span>
                <span className="text-center text-muted-foreground text-xs">{set.restTime}s</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Notes</h3>
          </div>
          <p className="text-muted-foreground text-sm">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function WorkoutDetailPage() {
  return (
    <Suspense fallback={<div className="page-container py-12 text-center text-muted-foreground">Loading workout details...</div>}>
      <WorkoutDetailPageContent />
    </Suspense>
  );
}
