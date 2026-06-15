"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useTasks } from "@/hooks/useTasks";
import {
  Flame, Dumbbell, Scale, Plus, ChevronRight,
  Clock, CheckSquare, TrendingUp, Zap, Trophy
} from "lucide-react";
import {
  getGreeting, formatWorkoutDate, formatDuration,
  calculateStreak, getSplitBg, toDate, cn
} from "@/lib/utils";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import type { Workout } from "@/types/workout";

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
  const { user, profile } = useAuth();
  const { workouts, loading: wLoading } = useWorkouts();
  const { tasks, loading: tLoading } = useTasks();

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

  return (
    <div className="page-container min-h-screen">
      {/* Header greeting */}
      <div className="mb-6 animate-fade-in">
        <p className="text-muted-foreground text-sm font-medium mb-1">{getGreeting()},</p>
        <h1 className="font-display text-3xl font-black">
          {(profile?.displayName || user?.displayName || "Athlete").split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
        {/* Streak */}
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

        {/* Weight */}
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

        {/* Total Workouts */}
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
      <Link
        href="/workout"
        className="block mb-6 animate-slide-up"
      >
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
