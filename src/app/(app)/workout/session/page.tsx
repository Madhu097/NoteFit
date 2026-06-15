"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useExercises, useWorkouts } from "@/hooks/useWorkouts";
import { getWorkout } from "@/lib/firebase/firestore";
import { Exercise, ExerciseSet } from "@/types/workout";
import { Workout } from "@/types/workout";
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp,
  Timer, Dumbbell, Save, X
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// Predefined exercise library
const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  push: ["Bench Press", "Incline Dumbbell Press", "Shoulder Press", "Lateral Raises", "Tricep Pushdowns", "Cable Flyes", "Push-ups"],
  pull: ["Lat Pulldown", "Deadlift", "Barbell Row", "Cable Row", "Face Pulls", "Bicep Curls", "Pull-ups"],
  legs: ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Leg Extension", "Calf Raises", "Bulgarian Split Squat"],
  upper: ["Bench Press", "Barbell Row", "Shoulder Press", "Pull-ups", "Bicep Curls", "Tricep Extensions"],
  lower: ["Squat", "Deadlift", "Leg Press", "Leg Curl", "Calf Raises", "Hip Thrust"],
  full_body: ["Squat", "Deadlift", "Bench Press", "Pull-ups", "Shoulder Press", "Lunges"],
  biceps: ["Bicep Curls", "Hammer Curls", "Preacher Curls", "Incline Dumbbell Curls", "Concentration Curls"],
  triceps: ["Tricep Pushdowns", "Overhead Tricep Extension", "Skull Crushers", "Dips", "Close Grip Bench Press"],
  custom: ["Custom Exercise"],
};

const DEFAULT_SET: ExerciseSet = { weight: 0, reps: 10, restTime: 90, completed: false };

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  workoutId: string;
  onUpdate: (id: string, data: Partial<Exercise>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

function ExerciseCard({ exercise, index, onUpdate, onRemove }: ExerciseCardProps) {
  const [sets, setSets] = useState<ExerciseSet[]>(exercise.sets || [DEFAULT_SET]);
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving] = useState(false);

  const updateSet = (i: number, field: keyof ExerciseSet, value: number | boolean) => {
    const updated = [...sets];
    updated[i] = { ...updated[i], [field]: value };
    setSets(updated);
  };

  const addSet = () => setSets([...sets, { ...DEFAULT_SET }]);
  const removeSet = (i: number) => {
    if (sets.length === 1) return;
    setSets(sets.filter((_, idx) => idx !== i));
  };

  const saveExercise = async () => {
    if (!exercise.id) return;
    setSaving(true);
    try {
      await onUpdate(exercise.id, { sets });
      toast.success("Sets saved!");
    } finally {
      setSaving(false);
    }
  };

  const completedSets = sets.filter((s) => s.completed).length;

  return (
    <div className={cn(
      "glass-card overflow-hidden transition-all duration-200",
      completedSets === sets.length && sets.length > 0 ? "border-neon-green/30" : ""
    )}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green font-bold text-sm flex-none">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{exercise.name}</h3>
          <p className="text-muted-foreground text-xs">
            {completedSets}/{sets.length} sets · {sets[0]?.weight ?? 0}kg
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
             type="button"
            onClick={() => exercise.id && onRemove(exercise.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
             type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Column headers */}
          <div className="grid grid-cols-[32px_1fr_1fr_1fr_32px] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Set</span>
            <span className="text-center">Weight (kg)</span>
            <span className="text-center">Reps</span>
            <span className="text-center">Rest (s)</span>
            <span />
          </div>

          {/* Sets */}
          {sets.map((set, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[32px_1fr_1fr_1fr_32px] gap-2 items-center",
                set.completed && "opacity-60"
              )}
            >
              <button
                type="button"
                onClick={() => updateSet(i, "completed", !set.completed)}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200",
                  set.completed
                    ? "bg-neon-green text-black"
                    : "bg-gym-charcoal border border-gym-border text-muted-foreground"
                )}
              >
                {set.completed ? "✓" : i + 1}
              </button>
              <input
                type="number"
                value={set.weight || ""}
                onChange={(e) => updateSet(i, "weight", Number(e.target.value))}
                placeholder="0"
                className="w-full py-2 px-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-center focus:outline-none focus:border-neon-green/50"
              />
              <input
                type="number"
                value={set.reps || ""}
                onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
                placeholder="10"
                className="w-full py-2 px-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-center focus:outline-none focus:border-neon-green/50"
              />
              <input
                type="number"
                value={set.restTime || ""}
                onChange={(e) => updateSet(i, "restTime", Number(e.target.value))}
                placeholder="90"
                className="w-full py-2 px-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-center focus:outline-none focus:border-neon-green/50"
              />
              <button
                type="button"
                onClick={() => removeSet(i)}
                disabled={sets.length === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={addSet}
              className="flex-1 py-2 rounded-xl border border-gym-border text-muted-foreground hover:border-neon-green/40 hover:text-neon-green text-xs font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Set
            </button>
            <button
              type="button"
              onClick={saveExercise}
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-semibold flex items-center justify-center gap-1 transition-all hover:bg-neon-green/20 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border border-neon-green/40 border-t-neon-green rounded-full animate-spin" />
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveWorkoutPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workoutId = (params?.id as string) || (searchParams?.get("id") as string);

  const { exercises, addEx, updateEx, removeEx, loading } = useExercises(workoutId);
  const { editWorkout } = useWorkouts();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [customName, setCustomName] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [startTime] = useState(Date.now());

  // Fetch workout info
  useEffect(() => {
    if (workoutId) {
      getWorkout(workoutId)
        .then(setWorkout)
        .catch((err) => {
          console.warn("Failed to load workout session (offline):", err);
        });
    }
  }, [workoutId]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000 / 60));
    }, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  const suggestions = workout
    ? EXERCISE_SUGGESTIONS[workout.split] ?? EXERCISE_SUGGESTIONS.custom
    : [];

  const handleAddExercise = async (name: string) => {
    await addEx({
      name,
      sets: [{ ...DEFAULT_SET }],
      order: exercises.length,
    });
    setShowAddExercise(false);
    setCustomName("");
    toast.success(`${name} added!`);
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      const totalVolume = exercises.reduce((total, ex) =>
        total + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
      );
      await editWorkout(workoutId, {
        duration: elapsed || 1,
        exerciseCount: exercises.length,
        totalVolume,
      });
      router.push(`/workout/summary?id=${workoutId}`);
    } catch {
      toast.error("Failed to finish workout");
    } finally {
      setFinishing(false);
    }
  };

  if (!workoutId) {
    return (
      <div className="page-container py-12 text-center text-muted-foreground">
        No active workout session found.
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/workout"
          className="w-9 h-9 rounded-xl bg-gym-charcoal border border-gym-border flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-black capitalize">
            {workout?.split?.replace("_", " ")} Day
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Timer className="w-3 h-3" />
            {formatDuration(elapsed)} elapsed · {exercises.length} exercises
          </div>
        </div>
        <button
          onClick={handleFinish}
          disabled={finishing || exercises.length === 0}
          className="neon-btn px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          {finishing ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            "Finish"
          )}
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-3 mb-4">
        {loading ? (
          [1, 2].map((i) => <div key={i} className="glass-card h-32 shimmer rounded-2xl" />)
        ) : exercises.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center">
              No exercises yet.<br />Add your first exercise below!
            </p>
          </div>
        ) : (
          exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              workoutId={workoutId}
              onUpdate={updateEx}
              onRemove={removeEx}
            />
          ))
        )}
      </div>

      {/* Add Exercise */}
      {showAddExercise ? (
        <div className="glass-card p-4 mb-4 animate-slide-up">
          <h3 className="font-semibold text-sm mb-3">Add Exercise</h3>
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => handleAddExercise(name)}
                className="px-3 py-1.5 rounded-full bg-gym-charcoal border border-gym-border text-xs font-medium hover:border-neon-green/40 hover:text-neon-green transition-all"
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Custom exercise name..."
              className="flex-1 px-3 py-2.5 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50"
              onKeyDown={(e) => e.key === "Enter" && customName && handleAddExercise(customName)}
            />
            <button
              onClick={() => customName && handleAddExercise(customName)}
              disabled={!customName}
              className="neon-btn px-4 py-2 text-sm disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <button
            onClick={() => setShowAddExercise(false)}
            className="mt-2 text-muted-foreground text-xs hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-gym-border text-muted-foreground hover:border-neon-green/40 hover:text-neon-green text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 mb-4"
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </button>
      )}
    </div>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<div className="page-container py-12 text-center text-muted-foreground">Loading workout...</div>}>
      <ActiveWorkoutPageContent />
    </Suspense>
  );
}
