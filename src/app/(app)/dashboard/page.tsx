"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useTasks } from "@/hooks/useTasks";
import {
  getPresetWorkouts, createPresetWorkout, updatePresetWorkout,
  deletePresetWorkout, startWorkoutFromPreset, PresetWorkout,
  PresetExercise
} from "@/lib/firebase/firestore";
import { WorkoutSplit } from "@/types/workout";
import {
  Flame, Dumbbell, Scale, Plus, ChevronRight,
  Clock, CheckSquare, TrendingUp, Zap, Trophy, Trash2, Edit3, X, Save
} from "lucide-react";
import {
  getGreeting, formatWorkoutDate, formatDuration,
  calculateStreak, getSplitBg, toDate, cn
} from "@/lib/utils";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import type { Workout } from "@/types/workout";
import { toast } from "sonner";

function SkeletonCard() {
  return (
    <div className="bg-gym-card/50 border border-gym-border/50 px-4 py-3 flex items-center gap-3 rounded-2xl animate-pulse h-[70px]">
      <div className="w-10 h-10 rounded-xl bg-gym-muted flex-none" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gym-muted rounded-md w-1/3" />
          <div className="h-3 bg-gym-muted rounded-md w-16" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 bg-gym-muted rounded-md w-12" />
          <div className="h-3 bg-gym-muted rounded-md w-16" />
        </div>
      </div>
      <div className="flex-none text-right space-y-1.5">
        <div className="h-3 bg-gym-muted rounded-md w-16 ml-auto" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { workouts, loading: wLoading, refetch: refetchWorkouts } = useWorkouts();
  const { tasks, loading: tLoading } = useTasks();

  const [presets, setPresets] = useState<PresetWorkout[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  // Admin Preset form states
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetWorkout | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetSplit, setPresetSplit] = useState<WorkoutSplit>("push");
  const [presetExercises, setPresetExercises] = useState<{ name: string; setsCount: number }[]>([
    { name: "", setsCount: 3 }
  ]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [startingPresetId, setStartingPresetId] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin" || profile?.isAdmin === true;

  const fetchPresets = async () => {
    setLoadingPresets(true);
    try {
      const list = await getPresetWorkouts();
      setPresets(list || []);
    } catch {
      toast.error("Failed to load suggested workouts");
    } finally {
      setLoadingPresets(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const streak = useMemo(() => {
    if (!workouts.length || !profile) return 0;
    return calculateStreak(workouts, profile.restDays ?? ["Sunday"]);
  }, [workouts, profile]);

  const weeklyWorkouts = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return workouts.filter((w) =>
      isWithinInterval(toDate(w.date), { start, end })
    );
  }, [workouts]);

  const recentWorkouts = workouts.slice(0, 4);
  const pendingTasks = tasks.filter((t) => t.status === "pending").slice(0, 3);
  const todayWorkout = weeklyWorkouts.find((w) => {
    const d = toDate(w.date);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const freq = profile?.workoutFrequency ?? 4;

  const handleOpenAddPreset = () => {
    setPresetName("");
    setPresetSplit("push");
    setPresetExercises([{ name: "", setsCount: 3 }]);
    setEditingPreset(null);
    setShowPresetForm(true);
  };

  const handleOpenEditPreset = (preset: PresetWorkout) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetSplit(preset.split);
    setPresetExercises(
      preset.exercises.map((e) => ({
        name: e.name,
        setsCount: e.sets.length || 3
      }))
    );
    setShowPresetForm(false);
  };

  const handleAddExerciseRow = () => {
    setPresetExercises([...presetExercises, { name: "", setsCount: 3 }]);
  };

  const handleRemoveExerciseRow = (idx: number) => {
    if (presetExercises.length === 1) return;
    setPresetExercises(presetExercises.filter((_, i) => i !== idx));
  };

  const handleExerciseRowChange = (idx: number, field: "name" | "setsCount", val: any) => {
    const updated = [...presetExercises];
    updated[idx] = { ...updated[idx], [field]: val };
    setPresetExercises(updated);
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) {
      toast.error("Suggested routine name is required");
      return;
    }

    const filteredEx = presetExercises.filter((e) => e.name.trim());
    if (filteredEx.length === 0) {
      toast.error("At least one exercise is required");
      return;
    }

    setSavingPreset(true);

    const exercisesData: PresetExercise[] = filteredEx.map((ex) => ({
      name: ex.name.trim(),
      sets: Array.from({ length: ex.setsCount }).map(() => ({
        weight: 0,
        reps: 10,
        restTime: 90
      }))
    }));

    const presetData = {
      name: presetName.trim(),
      split: presetSplit,
      exercises: exercisesData,
      createdBy: "admin"
    };

    try {
      if (editingPreset) {
        await updatePresetWorkout(editingPreset.id!, presetData);
        toast.success("Suggested routine updated!");
        setEditingPreset(null);
      } else {
        await createPresetWorkout(presetData);
        toast.success("Suggested routine created!");
        setShowPresetForm(false);
      }
      fetchPresets();
    } catch {
      toast.error("Failed to save suggested routine");
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this suggested workout preset?")) return;
    try {
      await deletePresetWorkout(id);
      toast.success("Preset deleted successfully");
      fetchPresets();
    } catch {
      toast.error("Failed to delete suggested routine");
    }
  };

  const handleStartPreset = async (preset: PresetWorkout) => {
    if (!user) return;
    setStartingPresetId(preset.id || "");
    try {
      const workoutId = await startWorkoutFromPreset(user.uid, preset);
      refetchWorkouts();
      toast.success(`Started workout split: ${preset.name}!`);
      router.push(`/workout/session?id=${workoutId}`);
    } catch (err) {
      toast.error("Failed to start workout from suggested routine");
    } finally {
      setStartingPresetId(null);
    }
  };

  return (
    <div className="page-container min-h-screen pb-16">
      {/* Header greeting */}
      <div className="mb-6 animate-fade-in flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{getGreeting()},</p>
          <h1 className="font-display text-3xl font-black">
            {(profile?.displayName || user?.displayName || "Athlete").split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        
        {isAdmin && !showPresetForm && !editingPreset && (
          <button
            onClick={handleOpenAddPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 transition-all text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Suggest Workout
          </button>
        )}
      </div>

      {/* Admin Preset Form */}
      {isAdmin && (showPresetForm || editingPreset) && (
        <form onSubmit={handleSavePreset} className="glass-card p-4 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4 border-b border-gym-border/40 pb-2">
            <h3 className="font-bold text-sm text-neon-green">
              {editingPreset ? "Edit Suggested Workout" : "Create Suggested Workout"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowPresetForm(false);
                setEditingPreset(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block font-semibold">ROUTINE NAME</label>
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. Hypertrophy Chest Blaster"
                className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-green/50"
                required
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block font-semibold">WORKOUT SPLIT</label>
              <select
                value={presetSplit}
                onChange={(e) => setPresetSplit(e.target.value as WorkoutSplit)}
                className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-green/50"
              >
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="legs">Legs</option>
                <option value="upper">Upper Body</option>
                <option value="lower">Lower Body</option>
                <option value="full_body">Full Body</option>
                <option value="biceps">Biceps</option>
                <option value="triceps">Triceps</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-2 block font-semibold">EXERCISES LIST</label>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {presetExercises.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      value={ex.name}
                      onChange={(e) => handleExerciseRowChange(idx, "name", e.target.value)}
                      placeholder="e.g. Bench Press"
                      className="flex-1 px-2.5 py-1.5 bg-gym-charcoal border border-gym-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-green/40"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={ex.setsCount}
                        onChange={(e) => handleExerciseRowChange(idx, "setsCount", Number(e.target.value) || 1)}
                        className="w-10 text-center py-1.5 bg-gym-charcoal border border-gym-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-green/40"
                        min="1"
                      />
                      <span className="text-[10px] text-muted-foreground">sets</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExerciseRow(idx)}
                      disabled={presetExercises.length === 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 flex-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddExerciseRow}
                className="mt-2 text-xs font-bold text-neon-green hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add Exercise
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPresetForm(false);
                  setEditingPreset(null);
                }}
                className="flex-1 py-2 rounded-xl border border-gym-border text-muted-foreground text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPreset}
                className="flex-1 py-2 bg-neon-green/20 border border-neon-green/40 text-neon-green rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-neon-green/30 disabled:opacity-50"
              >
                {savingPreset ? (
                  <div className="w-3.5 h-3.5 border border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Save Workout Preset</>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-muted-foreground text-xs">Streak</span>
          </div>
          <p className="font-display text-2xl font-black text-orange-400">
            {wLoading ? "—" : streak}
          </p>
          <p className="text-muted-foreground text-[10px]">days</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Scale className="w-3.5 h-3.5 text-neon-blue" />
            <span className="text-muted-foreground text-xs">Weight</span>
          </div>
          <p className="font-display text-2xl font-black text-neon-blue">
            {profile?.currentWeight ?? "—"}
          </p>
          <p className="text-muted-foreground text-[10px]">kg</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-pr-gold" />
            <span className="text-muted-foreground text-xs">Total</span>
          </div>
          <p className="font-display text-2xl font-black text-pr-gold">
            {wLoading ? "—" : workouts.length}
          </p>
          <p className="text-muted-foreground text-[10px]">workouts</p>
        </div>
      </div>

      {/* START WORKOUT CTA */}
      <Link href="/workout" className="block mb-6 animate-slide-up">
        <div className="relative overflow-hidden rounded-2xl neon-btn p-5">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-green to-emerald-400 opacity-90" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="font-bold text-black/60 text-xs mb-0.5">
                {todayWorkout ? "CONTINUE WORKOUT" : "START WORKOUT"}
              </p>
              <h2 className="font-display text-2xl font-black text-black">
                {todayWorkout ? String(todayWorkout.split).replace("_", " ").toUpperCase() : "Train Today 🔥"}
              </h2>
            </div>
            <div className="w-14 h-14 bg-black/10 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-black/80" />
            </div>
          </div>
        </div>
      </Link>

      {/* Suggested Preset Workouts */}
      {!loadingPresets && presets.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <h3 className="section-heading mb-3 flex items-center gap-1">
            Suggested Routines <span className="text-[10px] badge-blue px-2 py-0.5 rounded font-bold">Presets</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleStartPreset(preset)}
                className="glass-card p-4 flex items-center justify-between hover:border-neon-green/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center flex-none">
                    <Zap className="w-5 h-5 text-neon-green animate-glow-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground capitalize truncate max-w-[150px] md:max-w-[180px]">
                      {preset.name}
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      {preset.split} split · {preset.exercises?.length || 0} exercises
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEditPreset(preset)}
                        className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-green hover:bg-neon-green/10 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => preset.id && handleDeletePreset(preset.id, e)}
                        className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {startingPresetId === preset.id ? (
                    <div className="w-4 h-4 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Progress */}
      <div className="glass-card p-4 mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Workouts This Week</h3>
          <span className="text-muted-foreground text-xs">
            {weeklyWorkouts.length} / {freq} completed
          </span>
        </div>
        <div className="w-full bg-gym-muted rounded-full h-2.5 mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-green to-emerald-400 transition-all duration-700"
            style={{ width: `${Math.min((weeklyWorkouts.length / freq) * 100, 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
            const done = i < weeklyWorkouts.length;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300",
                    done
                      ? "bg-neon-green text-black"
                      : "bg-gym-muted text-muted-foreground"
                  )}
                >
                  {done ? "✓" : d}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-heading">Pending Tasks</h3>
            <Link href="/tasks" className="text-neon-green text-xs font-semibold flex items-center gap-1">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {pendingTasks.map((task) => (
              <div key={task.id} className="glass-card px-4 py-3 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-neon-green/50 flex-none" />
                <span className="text-sm font-medium">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-heading">Recent Workouts</h3>
          <Link href="/history" className="text-neon-green text-xs font-semibold flex items-center gap-1">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {wLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gym-muted flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              No workouts yet.<br />Start your first session!
            </p>
            <Link href="/workout" className="badge-green px-4 py-1.5 text-xs font-semibold">
              Start Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentWorkouts.map((workout) => (
              <WorkoutRow key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutRow({ workout }: { workout: Workout }) {
  return (
    <Link href={`/history/detail?id=${workout.id}`}>
      <div className="glass-card px-4 py-3 flex items-center gap-3 hover:border-gym-muted transition-all duration-200 active:scale-[0.98]">
        <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center flex-none">
          <Dumbbell className="w-5 h-5 text-neon-green" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm capitalize">
              {workout.split.replace("_", " ")} Day
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${getSplitBg(workout.split)}`}>
              {workout.split}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(workout.duration)}
            </span>
            <span className="text-muted-foreground text-xs">
              {workout.exerciseCount} exercises
            </span>
          </div>
        </div>
        <div className="flex-none text-right">
          <p className="text-muted-foreground text-xs">{formatWorkoutDate(workout.date)}</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 ml-auto" />
        </div>
      </div>
    </Link>
  );
}
