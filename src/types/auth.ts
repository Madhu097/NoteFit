import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  currentWeight: number | null;
  fitnessGoal: "build_muscle" | "gain_strength" | "lose_fat" | "stay_fit" | null;
  workoutFrequency: number;
  restDays: string[];
  phoneNumber?: string | null;
  normalizedPhoneNumber?: string | null;
  createdAt: Timestamp;
  onboardingComplete: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}
