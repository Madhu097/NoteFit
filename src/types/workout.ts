import { Timestamp } from "firebase/firestore";

export type WorkoutSplit =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full_body"
  | "custom";

export interface ExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed?: boolean;
}

export interface Exercise {
  id?: string;
  name: string;
  sets: ExerciseSet[];
  order: number;
  notes?: string;
}

export interface Workout {
  id?: string;
  userId: string;
  date: Timestamp | Date;
  split: WorkoutSplit;
  duration: number;
  notes: string;
  exerciseCount: number;
  totalVolume: number;
  createdAt?: Timestamp;
}

export const WORKOUT_SPLITS: { value: WorkoutSplit; label: string; icon: string }[] = [
  { value: "push", label: "Push", icon: "💪" },
  { value: "pull", label: "Pull", icon: "🔙" },
  { value: "legs", label: "Legs", icon: "🦵" },
  { value: "upper", label: "Upper Body", icon: "🏋️" },
  { value: "lower", label: "Lower Body", icon: "🧘" },
  { value: "full_body", label: "Full Body", icon: "⚡" },
  { value: "custom", label: "Custom", icon: "✏️" },
];
