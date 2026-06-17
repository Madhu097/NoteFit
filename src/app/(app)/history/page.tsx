"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useWorkouts } from "@/hooks/useWorkouts";
import { Search, Dumbbell, Clock, TrendingUp, Trash2 } from "lucide-react";
import { formatWorkoutDate, formatDuration, getSplitBg, formatVolume, cn } from "@/lib/utils";
import { WorkoutSplit, WORKOUT_SPLITS } from "@/types/workout";
import { toast } from "sonner";

export default function HistoryPage() {
  const { workouts, loading, removeWorkout } = useWorkouts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WorkoutSplit | "all">("all");

  const filtered = useMemo(() => {
    return workouts.filter((w) => {
      const matchesSearch =
        !search ||
        w.split.includes(search.toLowerCase()) ||
        (w.notes && w.notes.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === "all" || w.split === filter;
      return matchesSearch && matchesFilter;
    });
  }, [workouts, search, filter]);

  return (
    <div className="page-container pb-24">
      <h1 className="font-display text-2xl font-black mb-6">Workout History</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workouts..."
          className="w-full pl-10 pr-4 py-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            filter === "all"
              ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
              : "bg-gym-charcoal border-gym-border text-muted-foreground"
          )}
        >
          All
        </button>
        {WORKOUT_SPLITS.map((split) => (
          <button
            key={split.value}
            onClick={() => setFilter(split.value)}
            className={cn(
              "flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === split.value
                ? `${getSplitBg(split.value)}`
                : "bg-gym-charcoal border-gym-border text-muted-foreground"
            )}
          >
            {split.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-muted-foreground text-xs mb-4">
          {filtered.length} workout{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gym-card/50 border border-gym-border/50 px-4 py-3.5 flex items-center gap-3 rounded-2xl animate-pulse">
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
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center gap-3">
          <Dumbbell className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center">
            {search ? "No workouts match your search" : "No workouts yet"}
          </p>
          <Link href="/workout" className="badge-green px-4 py-1.5 text-xs">
            Start a Workout
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((workout) => (
            <div key={workout.id} className="glass-card p-4 hover:border-gym-muted transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center flex-none">
                  <Dumbbell className="w-5 h-5 text-neon-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/history/detail?id=${workout.id}`}>
                      <p className="font-semibold text-sm capitalize hover:text-neon-green transition-colors">
                        {workout.split.replace("_", " ")} Day
                      </p>
                    </Link>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getSplitBg(workout.split)}`}>
                      {workout.split}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDuration(workout.duration)}
                    </span>
                    <span>{workout.exerciseCount} exercises</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {formatVolume(workout.totalVolume)}
                    </span>
                  </div>
                  {workout.notes && (
                    <p className="text-muted-foreground text-xs mt-1 truncate">{workout.notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-muted-foreground text-xs">{formatWorkoutDate(workout.date)}</p>
                  <button
                    onClick={() => workout.id && removeWorkout(workout.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
