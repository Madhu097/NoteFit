"use client";

import { useState } from "react";
import { useProgress } from "@/hooks/useProgress";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useAuth } from "@/providers/AuthProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { progressSchema, ProgressInput } from "@/lib/validations/workout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import { TrendingUp, Scale, Dumbbell, Plus, X, Trophy, Edit3, Trash2, Check } from "lucide-react";
import { toDate, formatVolume } from "@/lib/utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressPage() {
  const { profile } = useAuth();
  const { progress, loading, logProgress, editProgress, removeProgress } = useProgress();
  const { workouts } = useWorkouts();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"weight" | "volume" | "records">("weight");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditWeight(String(p.weight || ""));
  };

  const handleSaveEdit = async (id: string) => {
    if (!editWeight || isNaN(Number(editWeight)) || Number(editWeight) <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }
    await editProgress(id, { weight: Number(editWeight) });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this weight log?")) {
      await removeProgress(id);
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProgressInput>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      date: new Date(),
      weight: undefined,
      measurements: { waist: null, chest: null, arms: null, bodyFat: null },
    },
  });

  const onSubmit = async (data: ProgressInput) => {
    await logProgress({
      date: data.date,
      weight: data.weight ?? null,
      measurements: {
        waist: data.measurements.waist ?? null,
        chest: data.measurements.chest ?? null,
        arms: data.measurements.arms ?? null,
        bodyFat: data.measurements.bodyFat ?? null,
      },
      personalRecords: [],
    });
    reset();
    setShowForm(false);
  };

  // Weight chart data
  const weightData = progress
    .filter((p) => p.weight)
    .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
    .slice(-30)
    .map((p) => ({
      date: format(toDate(p.date), "dd MMM"),
      weight: p.weight,
    }));

  // Volume chart data
  const volumeData = workouts
    .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
    .slice(-10)
    .map((w) => ({
      date: format(toDate(w.date), "dd MMM"),
      volume: w.totalVolume,
      split: w.split,
    }));

  const TABS = [
    { id: "weight", label: "Body Weight", icon: Scale },
    { id: "volume", label: "Volume", icon: TrendingUp },
    { id: "records", label: "Records", icon: Trophy },
  ] as const;

  if (loading) {
    return (
      <div className="page-container min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gym-muted rounded-md w-1/3 animate-pulse" />
          <div className="w-9 h-9 bg-gym-muted rounded-xl animate-pulse" />
        </div>
        
        {/* Tab selector skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-10 bg-gym-muted rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Chart card skeleton */}
        <div className="bg-gym-card/50 border border-gym-border/50 p-4 rounded-2xl h-64 animate-pulse mb-6 flex flex-col gap-4">
          <div className="h-5 bg-gym-muted rounded-md w-1/4" />
          <div className="flex-1 bg-gym-muted/30 rounded-xl" />
        </div>

        {/* History skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gym-muted rounded-md w-1/4 animate-pulse mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gym-card/50 border border-gym-border/50 px-4 py-3.5 rounded-2xl animate-pulse flex justify-between">
              <div className="h-4 bg-gym-muted rounded-md w-24" />
              <div className="h-4 bg-gym-muted rounded-md w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-black">Progress</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green hover:bg-neon-green/20 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick log form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-card p-4 mb-6 animate-slide-up"
        >
          <h3 className="font-semibold text-sm mb-4">Log Today's Progress</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
              <input
                {...register("weight", { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder={String(profile?.currentWeight ?? "75")}
                className="w-full px-3 py-2.5 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Waist (cm)</label>
              <input
                {...register("measurements.waist", { valueAsNumber: true })}
                type="number"
                placeholder="80"
                className="w-full px-3 py-2.5 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Chest (cm)</label>
              <input
                {...register("measurements.chest", { valueAsNumber: true })}
                type="number"
                placeholder="100"
                className="w-full px-3 py-2.5 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Arms (cm)</label>
              <input
                {...register("measurements.arms", { valueAsNumber: true })}
                type="number"
                placeholder="38"
                className="w-full px-3 py-2.5 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gym-border text-muted-foreground text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="neon-btn flex-1 py-2.5 text-sm font-bold">
              Save
            </button>
          </div>
        </form>
      )}

      {/* Tab selector */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all",
              tab === id
                ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                : "bg-gym-charcoal border-gym-border text-muted-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Weight tab */}
      {tab === "weight" && (
        <div className="animate-fade-in">
          {weightData.length >= 2 ? (
            <div className="glass-card p-4 mb-4">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-neon-blue" />
                Body Weight
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    name="Weight (kg)"
                    stroke="#00F5FF"
                    strokeWidth={2}
                    fill="url(#weightGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center gap-2 mb-4">
              <Scale className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm text-center">
                Log at least 2 weigh-ins to see your progress chart
              </p>
            </div>
          )}

          {/* Weight history list */}
          {progress.filter((p) => p.weight).length > 0 && (
            <div>
              <h3 className="section-heading">Weight History</h3>
              <div className="flex flex-col gap-2">
                {progress.filter((p) => p.weight).slice(0, 10).map((p) => (
                  <div key={p.id} className="glass-card px-4 py-3 flex items-center justify-between min-h-[52px]">
                    {editingId === p.id ? (
                      <div className="flex items-center justify-between gap-3 w-full animate-fade-in">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="number"
                            step="0.1"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            className="w-24 px-2.5 py-1.5 bg-gym-charcoal border border-gym-border rounded-xl text-xs text-foreground focus:outline-none focus:border-neon-green/50"
                          />
                          <span className="text-xs text-muted-foreground">kg</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => p.id && handleSaveEdit(p.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-neon-green hover:bg-neon-green/10 transition-all"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-gym-muted transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">{format(toDate(p.date), "dd MMM yyyy")}</p>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-neon-blue">{p.weight} kg</p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(p)}
                              className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-green hover:bg-neon-green/10 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => p.id && handleDelete(p.id)}
                              className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Volume tab */}
      {tab === "volume" && (
        <div className="animate-fade-in">
          {volumeData.length >= 2 ? (
            <div className="glass-card p-4 mb-4">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                Workout Volume
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="volume" name="Volume (kg)" fill="#39FF14" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center gap-2">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm text-center">
                Complete at least 2 workouts to see your volume chart
              </p>
            </div>
          )}

          {/* Volume stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="stat-card items-center">
              <p className="text-muted-foreground text-xs mb-1">Total Volume</p>
              <p className="font-display text-xl font-black text-neon-green">
                {formatVolume(workouts.reduce((s, w) => s + w.totalVolume, 0))}
              </p>
              <p className="text-muted-foreground text-[10px]">all time</p>
            </div>
            <div className="stat-card items-center">
              <p className="text-muted-foreground text-xs mb-1">Best Session</p>
              <p className="font-display text-xl font-black text-pr-gold">
                {formatVolume(Math.max(...workouts.map((w) => w.totalVolume), 0))}
              </p>
              <p className="text-muted-foreground text-[10px]">single workout</p>
            </div>
          </div>
        </div>
      )}

      {/* Records tab */}
      {tab === "records" && (
        <div className="animate-fade-in">
          {progress.flatMap((p) => p.personalRecords || []).length > 0 ? (
            <div className="flex flex-col gap-2">
              {progress.flatMap((p) => (p.personalRecords || []).map((pr) => ({ ...pr, date: p.date }))).map((pr, i) => (
                <div key={i} className="glass-card px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pr-gold/10 flex items-center justify-center flex-none">
                    <Trophy className="w-5 h-5 text-pr-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{pr.exercise}</p>
                    <p className="text-muted-foreground text-xs">{format(toDate(pr.date), "dd MMM yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-pr-gold">{pr.weight}kg × {pr.reps}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center gap-3">
              <Trophy className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm text-center">
                No personal records yet.<br />Keep training to set PRs!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
