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
  Clock, TrendingUp, Zap, Trophy, Trash2, Edit3, X, Save, CheckSquare
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
    <div className="bg-white/[0.03] border border-white/[0.06] px-4 py-3.5 flex items-center gap-3 rounded-2xl animate-pulse h-[70px]">
      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex-none" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/[0.05] rounded-md w-1/3" />
        <div className="h-3 bg-white/[0.04] rounded-md w-1/2" />
      </div>
      <div className="flex-none">
        <div className="h-3 bg-white/[0.04] rounded-md w-16" />
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
  const displayName = (profile?.displayName || user?.displayName || "Athlete").split(" ")[0];

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

  useEffect(() => { fetchPresets(); }, []);

  const streak = useMemo(() => {
    if (!workouts.length || !profile) return 0;
    return calculateStreak(workouts, profile.restDays ?? ["Sunday"]);
  }, [workouts, profile]);

  const weeklyWorkedDays = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const thisWeek = workouts.filter((w) =>
      w.duration > 0 && isWithinInterval(toDate(w.date), { start, end })
    );
    const days = new Set<number>();
    thisWeek.forEach((w) => {
      const date = toDate(w.date);
      const day = date.getDay();
      const isoDay = day === 0 ? 6 : day - 1;
      days.add(isoDay);
    });
    return days;
  }, [workouts]);

  const recentWorkouts = workouts.slice(0, 4);
  const pendingTasks = tasks.filter((t) => t.status === "pending").slice(0, 3);

  const todayWorkout = useMemo(() => {
    return workouts.find((w) => {
      if (w.duration > 0) return false;
      const d = toDate(w.date);
      d.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  }, [workouts]);

  const freq = profile?.workoutFrequency ?? 4;

  const handleOpenAddPreset = () => {
    setPresetName(""); setPresetSplit("push");
    setPresetExercises([{ name: "", setsCount: 3 }]);
    setEditingPreset(null); setShowPresetForm(true);
  };

  const handleOpenEditPreset = (preset: PresetWorkout) => {
    setEditingPreset(preset); setPresetName(preset.name); setPresetSplit(preset.split);
    setPresetExercises(preset.exercises.map((e) => ({ name: e.name, setsCount: e.sets.length || 3 })));
    setShowPresetForm(false);
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) { toast.error("Routine name is required"); return; }
    const filteredEx = presetExercises.filter((e) => e.name.trim());
    if (filteredEx.length === 0) { toast.error("At least one exercise is required"); return; }
    setSavingPreset(true);
    const exercisesData: PresetExercise[] = filteredEx.map((ex) => ({
      name: ex.name.trim(),
      sets: Array.from({ length: ex.setsCount }).map(() => ({ weight: 0, reps: 10, restTime: 90 }))
    }));
    const presetData = { name: presetName.trim(), split: presetSplit, exercises: exercisesData, createdBy: "admin" };
    try {
      if (editingPreset) {
        await updatePresetWorkout(editingPreset.id!, presetData);
        toast.success("Routine updated!"); setEditingPreset(null);
      } else {
        await createPresetWorkout(presetData);
        toast.success("Routine created!"); setShowPresetForm(false);
      }
      fetchPresets();
    } catch { toast.error("Failed to save routine"); } finally { setSavingPreset(false); }
  };

  const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this workout preset?")) return;
    try { await deletePresetWorkout(id); toast.success("Preset deleted"); fetchPresets(); }
    catch { toast.error("Failed to delete preset"); }
  };

  const handleStartPreset = async (preset: PresetWorkout) => {
    if (!user) return;
    setStartingPresetId(preset.id || "");
    try {
      const workoutId = await startWorkoutFromPreset(user.uid, preset);
      refetchWorkouts();
      toast.success(`Started: ${preset.name}`);
      router.push(`/workout/session?id=${workoutId}`);
    } catch { toast.error("Failed to start workout"); } finally { setStartingPresetId(null); }
  };

  return (
    <div className="page-container pb-24">
      {/* Header */}
      <div className="mb-7 animate-fade-in flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs font-medium mb-0.5 uppercase tracking-wider">{getGreeting()}</p>
          <h1 className="text-2xl font-black text-white tracking-tight">{displayName}</h1>
          <p className="text-white/30 text-xs mt-0.5">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>

        {isAdmin && !showPresetForm && !editingPreset && (
          <button
            onClick={handleOpenAddPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/70 hover:bg-white/[0.1] hover:text-white transition-all text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Suggest Workout
          </button>
        )}
      </div>

      {/* Admin Preset Form */}
      {isAdmin && (showPresetForm || editingPreset) && (
        <form onSubmit={handleSavePreset} className="glass-card p-5 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <h3 className="font-bold text-sm text-white">
              {editingPreset ? "Edit Routine" : "Create Routine"}
            </h3>
            <button type="button" onClick={() => { setShowPresetForm(false); setEditingPreset(null); }}
              className="text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-white/40 mb-1 block font-bold uppercase tracking-wider">Routine Name</label>
              <input value={presetName} onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. Hypertrophy Chest Blast"
                className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors" required />
            </div>

            <div>
              <label className="text-[10px] text-white/40 mb-1 block font-bold uppercase tracking-wider">Workout Split</label>
              <select value={presetSplit} onChange={(e) => setPresetSplit(e.target.value as WorkoutSplit)}
                className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-white/25 transition-colors">
                {["push","pull","legs","upper","lower","full_body","biceps","triceps","custom"].map(s => (
                  <option key={s} value={s} className="bg-[#111]">{s.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/40 mb-2 block font-bold uppercase tracking-wider">Exercises</label>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                {presetExercises.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input value={ex.name} onChange={(e) => {
                      const u=[...presetExercises]; u[idx]={...u[idx],name:e.target.value}; setPresetExercises(u);
                    }} placeholder="e.g. Bench Press"
                      className="flex-1 px-2.5 py-2 bg-white/[0.04] border border-white/[0.07] rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20" />
                    <div className="flex items-center gap-1">
                      <input type="number" value={ex.setsCount} min="1" onChange={(e) => {
                        const u=[...presetExercises]; u[idx]={...u[idx],setsCount:Number(e.target.value)||1}; setPresetExercises(u);
                      }} className="w-10 text-center py-2 bg-white/[0.04] border border-white/[0.07] rounded-xl text-xs text-white focus:outline-none focus:border-white/20" />
                      <span className="text-[10px] text-white/30">sets</span>
                    </div>
                    <button type="button" onClick={() => {
                      if(presetExercises.length===1)return;
                      setPresetExercises(presetExercises.filter((_,i)=>i!==idx));
                    }} disabled={presetExercises.length===1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setPresetExercises([...presetExercises,{name:"",setsCount:3}])}
                className="mt-2 text-xs font-bold text-white/50 hover:text-white flex items-center gap-0.5 transition-colors">
                <Plus className="w-3 h-3" /> Add Exercise
              </button>
            </div>

            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => { setShowPresetForm(false); setEditingPreset(null); }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/40 text-xs hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={savingPreset}
                className="flex-1 py-2.5 bg-white text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/90 disabled:opacity-40 transition-all">
                {savingPreset ? <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  : <><Save className="w-3.5 h-3.5" /> Save Preset</>}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
        {[
          { icon: <Flame className="w-3.5 h-3.5 text-orange-400" />, label: "Streak", value: wLoading ? "—" : streak, unit: "days", color: "text-orange-400" },
          { icon: <Scale className="w-3.5 h-3.5 text-white/60" />, label: "Weight", value: profile?.currentWeight ?? "—", unit: "kg", color: "text-white" },
          { icon: <Trophy className="w-3.5 h-3.5 text-white/50" />, label: "Total", value: wLoading ? "—" : workouts.length, unit: "workouts", color: "text-white" },
        ].map(({ icon, label, value, unit, color }) => (
          <div key={label} className="glass-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              {icon}
              <span className="text-white/40 text-xs">{label}</span>
            </div>
            <p className={cn("text-2xl font-black leading-none", color)}>{value}</p>
            <p className="text-white/30 text-[10px]">{unit}</p>
          </div>
        ))}
      </div>

      {/* START WORKOUT CTA */}
      <Link
        href={todayWorkout ? `/workout/session?id=${todayWorkout.id}` : "/workout"}
        className="block mb-6 animate-slide-up"
      >
        <div className="relative overflow-hidden rounded-2xl p-5 bg-white cursor-pointer hover:bg-white/95 active:scale-[0.99] transition-all duration-150 shadow-[0_8px_32px_rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-black/50 text-xs mb-0.5 uppercase tracking-wider">
                {todayWorkout ? "Continue Workout" : "Start Workout"}
              </p>
              <h2 className="text-2xl font-black text-black leading-tight">
                {todayWorkout
                  ? String(todayWorkout.split).replace("_", " ").toUpperCase()
                  : "Train Today"}
              </h2>
            </div>
            <div className="w-12 h-12 bg-black/[0.07] rounded-xl flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-black/70" />
            </div>
          </div>
        </div>
      </Link>

      {/* Suggested Preset Workouts */}
      {!loadingPresets && presets.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <h3 className="section-heading flex items-center gap-2">
            Suggested Routines
            <span className="text-[10px] bg-white/10 border border-white/15 px-2 py-0.5 rounded-full text-white/60 font-bold normal-case tracking-normal">
              {presets.length} presets
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handleStartPreset(preset)}
                className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.05] cursor-pointer transition-all duration-150 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-none">
                    <Zap className="w-4.5 h-4.5 text-white/70" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white capitalize truncate max-w-[150px] md:max-w-[180px]">
                      {preset.name}
                    </h4>
                    <p className="text-white/35 text-xs capitalize">
                      {preset.split.replace("_"," ")} · {preset.exercises?.length || 0} exercises
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {isAdmin && (
                    <>
                      <button onClick={() => handleOpenEditPreset(preset)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => preset.id && handleDeletePreset(preset.id, e)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {startingPresetId === preset.id ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Progress */}
      <div className="glass-card p-5 mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-white">This Week</h3>
          <span className="text-white/40 text-xs">
            {weeklyWorkedDays.size} / {freq} days
          </span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-4">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${Math.min((weeklyWorkedDays.size / freq) * 100, 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
            const done = weeklyWorkedDays.has(i);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300",
                  done ? "bg-white text-black" : "bg-white/[0.05] text-white/25"
                )}>
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
            <Link href="/tasks" className="text-white/50 text-xs font-semibold flex items-center gap-1 hover:text-white transition-colors">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {pendingTasks.map((task) => (
              <div key={task.id} className="glass-card px-4 py-3 flex items-center gap-3">
                <div className="w-4.5 h-4.5 rounded-full border border-white/20 flex-none" />
                <span className="text-sm text-white/80 font-medium">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-heading">Recent Workouts</h3>
          <Link href="/history" className="text-white/50 text-xs font-semibold flex items-center gap-1 hover:text-white transition-colors">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {wLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="glass-card p-10 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-white/25" />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-sm font-medium">No workouts yet</p>
              <p className="text-white/30 text-xs mt-0.5">Start your first session!</p>
            </div>
            <Link href="/workout" className="px-5 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-white/90 transition-all">
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
      <div className="glass-card px-4 py-3.5 flex items-center gap-3 hover:bg-white/[0.04] transition-all duration-150 active:scale-[0.99]">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-none">
          <Dumbbell className="w-4.5 h-4.5 text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-white capitalize">
              {workout.split.replace("_", " ")} Day
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.1] text-white/50 capitalize">
              {workout.split}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-white/35 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(workout.duration)}
            </span>
            <span className="text-white/35 text-xs">
              {workout.exerciseCount} exercises
            </span>
          </div>
        </div>
        <div className="flex-none text-right">
          <p className="text-white/30 text-xs">{formatWorkoutDate(workout.date)}</p>
          <ChevronRight className="w-4 h-4 text-white/20 mt-1 ml-auto" />
        </div>
      </div>
    </Link>
  );
}
