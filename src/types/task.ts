import { Timestamp } from "firebase/firestore";

export type TaskStatus = "pending" | "complete";

export interface Task {
  id?: string;
  userId: string;
  title: string;
  dueDate: Timestamp | null;
  status: TaskStatus;
  createdAt: Timestamp;
}
