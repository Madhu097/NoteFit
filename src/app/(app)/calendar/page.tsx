"use client";

import { useState, useMemo } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { toDate, getSplitBg, formatDuration, formatVolume } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, startOfWeek, addDays
} from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CalendarPage() {
  const { workouts, loading } = useWorkouts();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const startWeek = startOfWeek(start, { weekStartsOn: 1 });
    const days: Date[] = [];
    let current = startWeek;
    while (current <= end || days.length % 7 !== 0) {
      days.push(current);
      current = addDays(current, 1);
      if (days.length > 42) break;
    }
    return days;
  }, [currentMonth]);

  const workoutDays = useMemo(() => {
    return workouts.map((w) => toDate(w.date));
  }, [workouts]);

  const selectedWorkouts = useMemo(() => {
    if (!selected) return [];
    return workouts.filter((w) => isSameDay(toDate(w.date), selected));
  }, [selected, workouts]);

  const getDayIndicator = (day: Date) => {
    const hasWorkout = workoutDays.some((d) => isSameDay(d, day));
    if (hasWorkout) return "workout";
    return null;
  };

  return (
    <div className="page-container min-h-screen">
      <h1 className="font-display text-2xl font-black mb-6">Calendar</h1>

      {/* Month navigation */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
            className="w-8 h-8 rounded-lg bg-gym-charcoal border border-gym-border flex items-center justify-center hover:border-neon-green/30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-base">{format(currentMonth, "MMMM yyyy")}</h2>
          <button
            onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
            className="w-8 h-8 rounded-lg bg-gym-charcoal border border-gym-border flex items-center justify-center hover:border-neon-green/30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-muted-foreground text-[10px] font-semibold py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, i) => {
            const indicator = getDayIndicator(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selected && isSameDay(day, selected);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={i}
                onClick={() => setSelected(isSelected ? null : day)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl h-10 text-xs font-medium transition-all duration-200",
                  !isCurrentMonth && "opacity-25",
                  isSelected && "bg-neon-green/10 border border-neon-green/50",
                  isToday && !isSelected && "border border-neon-green/30",
                  !isSelected && "hover:bg-gym-charcoal"
                )}
              >
                <span className={cn(isToday && "text-neon-green font-bold")}>
                  {format(day, "d")}
                </span>
                {indicator === "workout" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gym-border">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neon-green" />
            <span className="text-muted-foreground text-[10px]">Workout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border border-neon-green/30" />
            <span className="text-muted-foreground text-[10px]">Today</span>
          </div>
        </div>
      </div>

      {/* Selected day workouts */}
      {selected && (
        <div className="animate-slide-up">
          <h3 className="section-heading">{format(selected, "EEEE, MMMM d")}</h3>
          {selectedWorkouts.length === 0 ? (
            <div className="glass-card p-6 flex flex-col items-center gap-2">
              <p className="text-muted-foreground text-sm">No workout on this day</p>
              <Link href="/workout" className="badge-green px-3 py-1 text-xs">
                Add Workout
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedWorkouts.map((w) => (
                <Link key={w.id} href={`/history/detail?id=${w.id}`}>
                  <div className="glass-card px-4 py-3 flex items-center gap-3 hover:border-gym-muted transition-all">
                    <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center flex-none">
                      <Dumbbell className="w-5 h-5 text-neon-green" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm capitalize">
                        {w.split.replace("_", " ")} Day
                      </p>
                      <div className="flex gap-3 text-muted-foreground text-xs mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDuration(w.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {formatVolume(w.totalVolume)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getSplitBg(w.split)}`}>
                      {w.split}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
