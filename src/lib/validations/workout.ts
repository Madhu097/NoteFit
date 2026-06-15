import { z } from "zod";

export const workoutSchema = z.object({
  split: z.enum(["push", "pull", "legs", "upper", "lower", "full_body", "custom"]),
  date: z.date(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  notes: z.string().optional(),
});

export const exerciseSetSchema = z.object({
  weight: z.number().min(0, "Weight cannot be negative"),
  reps: z.number().min(1, "Must have at least 1 rep"),
  restTime: z.number().min(0),
});

export const exerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  sets: z.array(exerciseSetSchema).min(1, "Must have at least 1 set"),
  notes: z.string().optional(),
});

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  dueDate: z.date().optional().nullable(),
});

export const progressSchema = z.object({
  date: z.date(),
  weight: z.number().min(0).optional().nullable(),
  measurements: z.object({
    waist: z.number().optional().nullable(),
    chest: z.number().optional().nullable(),
    arms: z.number().optional().nullable(),
    bodyFat: z.number().optional().nullable(),
  }),
});

export type WorkoutInput = z.infer<typeof workoutSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
