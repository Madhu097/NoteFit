"use client";
 
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { getWorkout } from "@/lib/firebase/firestore";
import { Workout, Exercise, ExerciseSet } from "@/types/workout";
import {
  ArrowLeft, Clock, Dumbbell, TrendingUp, FileText, Trash2,
  Edit3, Save, X, Plus
} from "lucide-react";
import { formatWorkoutDate, formatDuration, formatVolume, getSplitBg } from "@/lib/utils";
import { useWorkouts, useExercises } from "@/hooks/useWorkouts";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const DEFAULT_SET: ExerciseSet = { weight: 0, reps: 10, restTime: 90, completed: true };

function WorkoutDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const workoutId = (params?.id as string) || (searchParams?.get("id") as string);
  
  const { removeWorkout, editWorkout } = useWorkouts();
  const { exercises, addEx, updateEx, removeEx, refetch: refetchEx } = useExercises(workoutId);
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workoutId) {
      setLoading(true);
      getWorkout(workoutId)
        .then((w) => {
          setWorkout(w);
          if (w) {
            setNotes(w.notes || "");
            setDuration(w.duration || 0);
          }
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

  const handleSaveChanges = async () => {
    if (!workoutId) return;
    setSaving(true);
    try {
      const totalVolume = exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((sAcc, set) => sAcc + Number(set.weight || 0) * Number(set.reps || 0), 0), 0
      );
      
      await editWorkout(workoutId, {
        notes,
        duration: Number(duration) || 1,
        exerciseCount: exercises.length,
        totalVolume,
      });

      // Refetch workout info to update the display
      const updated = await getWorkout(workoutId);
      if (updated) {
        setWorkout(updated);
      }
      setIsEditing(false);
      toast.success("Workout saved successfully!");
    } catch (err) {
      toast.error("Failed to save workout changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (workout) {
      setNotes(workout.notes || "");
      setDuration(workout.duration || 0);
    }
    refetchEx();
    setIsEditing(false);
  };

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

  const handleSetChange = (exerciseId: string, setIdx: number, field: keyof ExerciseSet, value: any) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    const updatedSets = [...(ex.sets || [])];
    updatedSets[setIdx] = { ...updatedSets[setIdx], [field]: value };
    updateEx(exerciseId, { sets: updatedSets });
  };

  const handleAddSet = (exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    const updatedSets = [...(ex.sets || []), { ...DEFAULT_SET }];
    updateEx(exerciseId, { sets: updatedSets });
  };

  const handleRemoveSet = (exerciseId: string, setIdx: number) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex || (ex.sets || []).length <= 1) return;
    const updatedSets = (ex.sets || []).filter((_, idx) => idx !== setIdx);
    updateEx(exerciseId, { sets: updatedSets });
  };

  const suggestions = workout
    ? EXERCISE_SUGGESTIONS[workout.split] ?? EXERCISE_SUGGESTIONS.custom
    : [];

  const dynamicVolume = exercises.reduce((acc, ex) =>
    acc + ex.sets.reduce((sAcc, set) => sAcc + Number(set.weight || 0) * Number(set.reps || 0), 0), 0
  );

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
          <button
            onClick={() => isEditing ? handleCancel() : router.push("/history")}
            className="w-9 h-9 rounded-xl bg-gym-charcoal border border-gym-border flex items-center justify-center text-foreground hover:bg-gym-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-xl font-black capitalize">
              {isEditing ? "Edit Workout" : `${workout.split.replace("_", " ")} Day`}
            </h1>
            <p className="text-muted-foreground text-sm">{formatWorkoutDate(workout.date)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="w-9 h-9 rounded-xl border border-gym-border flex items-center justify-center text-muted-foreground hover:bg-gym-muted/40 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="w-9 h-9 rounded-xl bg-neon-green/20 border border-neon-green/40 flex items-center justify-center text-neon-green hover:bg-neon-green/30 disabled:opacity-40 transition-all"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="w-9 h-9 rounded-xl bg-gym-charcoal border border-gym-border flex items-center justify-center text-muted-foreground hover:text-neon-green hover:bg-neon-green/10 transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="w-9 h-9 rounded-xl border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat-card items-center">
          <Clock className="w-4 h-4 text-neon-blue mb-1" />
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-12 text-center bg-gym-charcoal border border-gym-border rounded px-1 text-sm font-semibold text-neon-blue focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">m</span>
            </div>
          ) : (
            <p className="font-display text-lg font-black text-neon-blue">{formatDuration(workout.duration)}</p>
          )}
          <p className="text-muted-foreground text-[10px]">Duration</p>
        </div>
        <div className="stat-card items-center">
          <Dumbbell className="w-4 h-4 text-neon-green mb-1" />
          <p className="font-display text-lg font-black text-neon-green">{exercises.length}</p>
          <p className="text-muted-foreground text-[10px]">Exercises</p>
        </div>
        <div className="stat-card items-center">
          <TrendingUp className="w-4 h-4 text-pr-gold mb-1" />
          <p className="font-display text-lg font-black text-pr-gold">
            {formatVolume(isEditing ? dynamicVolume : workout.totalVolume)}
          </p>
          <p className="text-muted-foreground text-[10px]">Volume</p>
        </div>
      </div>

      {/* Split badge */}
      <div className="mb-4">
        <span className={`text-xs px-2.5 py-1 rounded-full border ${getSplitBg(workout.split)} font-semibold`}>
          {workout.split.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Notes */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Notes</h3>
        </div>
        {isEditing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write workout notes..."
            className="w-full min-h-[80px] p-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 text-foreground placeholder:text-muted-foreground"
          />
        ) : (
          <p className="text-muted-foreground text-sm">{workout.notes || "No notes for this workout."}</p>
        )}
      </div>

      {/* Exercises */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-heading">Exercises</h3>
        {isEditing && (
          <button
            onClick={() => setShowAddExercise(!showAddExercise)}
            className="text-xs font-bold text-neon-green flex items-center gap-1 hover:underline"
          >
            {showAddExercise ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddExercise ? "Cancel" : "Add Exercise"}
          </button>
        )}
      </div>

      {/* Add exercise subform */}
      {isEditing && showAddExercise && (
        <div className="glass-card p-4 mb-4 animate-slide-up">
          <h3 className="font-semibold text-sm mb-3">Add Exercise</h3>
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
              className="flex-1 px-3 py-2.5 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 text-foreground"
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
        </div>
      )}

      {/* Exercise Cards */}
      <div className="flex flex-col gap-3 mb-6">
        {exercises.map((ex, idx) => (
          <div key={ex.id} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-xs font-bold flex-none">
                  {idx + 1}
                </div>
                {isEditing ? (
                  <input
                    value={ex.name}
                    onChange={(e) => updateEx(ex.id!, { name: e.target.value })}
                    className="bg-gym-charcoal border border-gym-border rounded px-2 py-1 text-sm font-semibold text-foreground focus:outline-none"
                  />
                ) : (
                  <h4 className="font-semibold text-sm">{ex.name}</h4>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => ex.id && removeEx(ex.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-[28px_1fr_1fr_1fr_28px] gap-2 text-[10px] text-muted-foreground font-semibold px-1 mb-2">
              <span>Set</span>
              <span className="text-center">Weight</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Rest</span>
              <span />
            </div>

            {(ex.sets || []).map((set, i) => (
              <div key={i} className="grid grid-cols-[28px_1fr_1fr_1fr_28px] gap-2 text-sm py-1.5 border-b border-gym-border/50 last:border-0 items-center">
                <span className="text-muted-foreground text-xs font-bold">{i + 1}</span>
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      value={set.weight || ""}
                      onChange={(e) => handleSetChange(ex.id!, i, "weight", Number(e.target.value))}
                      placeholder="0"
                      className="w-full py-1 bg-gym-charcoal border border-gym-border rounded text-sm text-center text-foreground focus:outline-none"
                    />
                    <input
                      type="number"
                      value={set.reps || ""}
                      onChange={(e) => handleSetChange(ex.id!, i, "reps", Number(e.target.value))}
                      placeholder="10"
                      className="w-full py-1 bg-gym-charcoal border border-gym-border rounded text-sm text-center text-foreground focus:outline-none"
                    />
                    <input
                      type="number"
                      value={set.restTime || ""}
                      onChange={(e) => handleSetChange(ex.id!, i, "restTime", Number(e.target.value))}
                      placeholder="90"
                      className="w-full py-1 bg-gym-charcoal border border-gym-border rounded text-sm text-center text-foreground focus:outline-none"
                    />
                    <button
                      onClick={() => handleRemoveSet(ex.id!, i)}
                      disabled={(ex.sets || []).length <= 1}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 flex-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-center font-semibold">{set.weight}kg</span>
                    <span className="text-center text-muted-foreground">{set.reps}</span>
                    <span className="text-center text-muted-foreground text-xs">{set.restTime}s</span>
                    <span />
                  </>
                )}
              </div>
            ))}

            {isEditing && (
              <button
                onClick={() => handleAddSet(ex.id!)}
                className="w-full mt-2 py-1.5 rounded bg-gym-charcoal border border-gym-border text-muted-foreground hover:text-neon-green hover:border-neon-green/20 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Set
              </button>
            )}
          </div>
        ))}
      </div>
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
