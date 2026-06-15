import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday } from "date-fns";
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === "object" && "seconds" in value) {
    return new Date(value.seconds * 1000);
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export function formatWorkoutDate(date: Timestamp | Date | undefined | null): string {
  const d = toDate(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd MMM yyyy");
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function calculateVolume(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0);
}

export function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k kg`;
  return `${volume} kg`;
}

export function getSplitColor(split: string): string {
  const colors: Record<string, string> = {
    push: "text-neon-green",
    pull: "text-neon-blue",
    legs: "text-purple-400",
    upper: "text-orange-400",
    lower: "text-yellow-400",
    full_body: "text-pink-400",
    custom: "text-gray-400",
  };
  return colors[split] || "text-gray-400";
}

export function getSplitBg(split: string): string {
  const colors: Record<string, string> = {
    push: "bg-neon-green/10 text-neon-green border-neon-green/20",
    pull: "bg-neon-blue/10 text-neon-blue border-neon-blue/20",
    legs: "bg-purple-400/10 text-purple-400 border-purple-400/20",
    upper: "bg-orange-400/10 text-orange-400 border-orange-400/20",
    lower: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    full_body: "bg-pink-400/10 text-pink-400 border-pink-400/20",
    custom: "bg-gray-400/10 text-gray-400 border-gray-400/20",
  };
  return colors[split] || "bg-gray-400/10 text-gray-400 border-gray-400/20";
}

export function calculateStreak(workouts: { date: Timestamp | Date }[], restDays: string[]): number {
  if (!workouts.length) return 0;
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const sorted = [...workouts].sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 365; i++) {
    const dayName = days[checkDate.getDay()];
    const isRestDay = restDays.includes(dayName);
    const hasWorkout = sorted.some((w) => {
      const d = toDate(w.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === checkDate.getTime();
    });

    if (isRestDay) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }
    if (hasWorkout) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
