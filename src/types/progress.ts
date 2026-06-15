import { Timestamp } from "firebase/firestore";

export interface Measurements {
  waist: number | null;
  chest: number | null;
  arms: number | null;
  bodyFat: number | null;
}

export interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: number;
  date: Timestamp | Date;
}

export interface ProgressEntry {
  id?: string;
  userId: string;
  date: Timestamp | Date;
  weight: number | null;
  measurements: Measurements;
  personalRecords: PersonalRecord[];
  createdAt?: Timestamp;
}
