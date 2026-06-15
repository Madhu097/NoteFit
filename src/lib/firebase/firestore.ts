import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db, isMock } from "./config";
import { Workout, Exercise, WorkoutSplit } from "@/types/workout";
import { Note } from "@/types/note";
import { Task } from "@/types/task";
import { ProgressEntry } from "@/types/progress";
import { toDate } from "@/lib/utils";

// --- MOCK STORAGE HELPERS ---
const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultValue;
};

const setLocalStorageItem = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

// ─── WORKOUTS ─────────────────────────────────────────────────────────────────

export const createWorkout = async (
  userId: string,
  data: Omit<Workout, "id" | "userId" | "createdAt">
) => {
  if (isMock) {
    const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
    const id = "workout_" + Math.random().toString(36).substring(2, 9);
    const newWorkout: Workout = {
      ...data,
      id,
      userId,
      date: data.date || { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    } as any;
    workouts.push(newWorkout);
    setLocalStorageItem("notfit_mock_workouts", workouts);
    return id;
  }

  const ref = await addDoc(collection(db, "workouts"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getWorkouts = async (userId: string): Promise<Workout[]> => {
  if (isMock) {
    const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
    return workouts
      .filter((w) => w.userId === userId)
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  }

  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workout));
};

export const getWorkout = async (id: string): Promise<Workout | null> => {
  if (isMock) {
    const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
    return workouts.find((w) => w.id === id) || null;
  }

  const snap = await getDoc(doc(db, "workouts", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Workout;
};

export const updateWorkout = async (id: string, data: Partial<Workout>) => {
  if (isMock) {
    const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
    const idx = workouts.findIndex((w) => w.id === id);
    if (idx !== -1) {
      workouts[idx] = { ...workouts[idx], ...data } as Workout;
      setLocalStorageItem("notfit_mock_workouts", workouts);
    }
    return;
  }

  await updateDoc(doc(db, "workouts", id), data);
};

export const deleteWorkout = async (id: string) => {
  if (isMock) {
    const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
    const filtered = workouts.filter((w) => w.id !== id);
    setLocalStorageItem("notfit_mock_workouts", filtered);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`notfit_mock_exercises_${id}`);
    }
    return;
  }

  await deleteDoc(doc(db, "workouts", id));
};

export const getRecentWorkouts = async (
  userId: string,
  count = 5
): Promise<Workout[]> => {
  if (isMock) {
    const workouts = await getWorkouts(userId);
    return workouts.slice(0, count);
  }

  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workout));
};

// ─── EXERCISES (subcollection) ─────────────────────────────────────────────────

export const addExercise = async (
  workoutId: string,
  data: Omit<Exercise, "id">
) => {
  if (isMock) {
    const key = `notfit_mock_exercises_${workoutId}`;
    const exercises = getLocalStorageItem<Exercise[]>(key, []);
    const id = "exercise_" + Math.random().toString(36).substring(2, 9);
    const newEx: Exercise = {
      ...data,
      id,
    } as any;
    exercises.push(newEx);
    setLocalStorageItem(key, exercises);
    
    // Update exerciseCount and totalVolume on workout
    const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
    const wIdx = workouts.findIndex((w) => w.id === workoutId);
    if (wIdx !== -1) {
      const totalVol = exercises.reduce((acc, ex) => {
        const exVol = ex.sets.reduce((sAcc, set) => sAcc + (Number(set.weight) * Number(set.reps)), 0);
        return acc + exVol;
      }, 0);
      workouts[wIdx].exerciseCount = exercises.length;
      workouts[wIdx].totalVolume = totalVol;
      setLocalStorageItem("notfit_mock_workouts", workouts);
    }
    return id;
  }

  const ref = await addDoc(
    collection(db, "workouts", workoutId, "exercises"),
    data
  );
  return ref.id;
};

export const getExercises = async (workoutId: string): Promise<Exercise[]> => {
  if (isMock) {
    const key = `notfit_mock_exercises_${workoutId}`;
    const exercises = getLocalStorageItem<Exercise[]>(key, []);
    return exercises.sort((a, b) => a.order - b.order);
  }

  const q = query(
    collection(db, "workouts", workoutId, "exercises"),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise));
};

export const updateExercise = async (
  workoutId: string,
  exerciseId: string,
  data: Partial<Exercise>
) => {
  if (isMock) {
    const key = `notfit_mock_exercises_${workoutId}`;
    const exercises = getLocalStorageItem<Exercise[]>(key, []);
    const idx = exercises.findIndex((e) => e.id === exerciseId);
    if (idx !== -1) {
      exercises[idx] = { ...exercises[idx], ...data } as Exercise;
      setLocalStorageItem(key, exercises);
      
      // Update totalVolume on workout
      const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
      const wIdx = workouts.findIndex((w) => w.id === workoutId);
      if (wIdx !== -1) {
        const totalVol = exercises.reduce((acc, ex) => {
          const exVol = ex.sets.reduce((sAcc, set) => sAcc + (Number(set.weight) * Number(set.reps)), 0);
          return acc + exVol;
        }, 0);
        workouts[wIdx].totalVolume = totalVol;
        setLocalStorageItem("notfit_mock_workouts", workouts);
      }
    }
    return;
  }

  await updateDoc(
    doc(db, "workouts", workoutId, "exercises", exerciseId),
    data
  );
};

export const deleteExercise = async (workoutId: string, exerciseId: string) => {
  if (isMock) {
    const key = `notfit_mock_exercises_${workoutId}`;
    const exercises = getLocalStorageItem<Exercise[]>(key, []);
    const filtered = exercises.filter((e) => e.id !== exerciseId);
    setLocalStorageItem(key, filtered);
    
    // Update exerciseCount and totalVolume on workout
    const workouts = getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
    const wIdx = workouts.findIndex((w) => w.id === workoutId);
    if (wIdx !== -1) {
      const totalVol = filtered.reduce((acc, ex) => {
        const exVol = ex.sets.reduce((sAcc, set) => sAcc + (Number(set.weight) * Number(set.reps)), 0);
        return acc + exVol;
      }, 0);
      workouts[wIdx].exerciseCount = filtered.length;
      workouts[wIdx].totalVolume = totalVol;
      setLocalStorageItem("notfit_mock_workouts", workouts);
    }
    return;
  }

  await deleteDoc(doc(db, "workouts", workoutId, "exercises", exerciseId));
};

// ─── NOTES ────────────────────────────────────────────────────────────────────

export const createNote = async (
  userId: string,
  data: Omit<Note, "id" | "userId" | "createdAt" | "updatedAt">
) => {
  if (isMock) {
    const notes = getLocalStorageItem<Note[]>("notfit_mock_notes", []);
    const id = "note_" + Math.random().toString(36).substring(2, 9);
    const now = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
    const newNote: Note = {
      ...data,
      id,
      userId,
      createdAt: now as any,
      updatedAt: now as any,
    };
    notes.push(newNote);
    setLocalStorageItem("notfit_mock_notes", notes);
    return id;
  }

  const ref = await addDoc(collection(db, "notes"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getNotes = async (userId: string): Promise<Note[]> => {
  if (isMock) {
    const notes = getLocalStorageItem<Note[]>("notfit_mock_notes", []);
    return notes
      .filter((n) => n.userId === userId)
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }

  const q = query(
    collection(db, "notes"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
};

export const updateNote = async (id: string, data: Partial<Note>) => {
  if (isMock) {
    const notes = getLocalStorageItem<Note[]>("notfit_mock_notes", []);
    const idx = notes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      const now = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      notes[idx] = { ...notes[idx], ...data, updatedAt: now as any } as Note;
      setLocalStorageItem("notfit_mock_notes", notes);
    }
    return;
  }

  await updateDoc(doc(db, "notes", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteNote = async (id: string) => {
  if (isMock) {
    const notes = getLocalStorageItem<Note[]>("notfit_mock_notes", []);
    const filtered = notes.filter((n) => n.id !== id);
    setLocalStorageItem("notfit_mock_notes", filtered);
    return;
  }

  await deleteDoc(doc(db, "notes", id));
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const createTask = async (
  userId: string,
  data: Omit<Task, "id" | "userId" | "createdAt">
) => {
  if (isMock) {
    const tasks = getLocalStorageItem<Task[]>("notfit_mock_tasks", []);
    const id = "task_" + Math.random().toString(36).substring(2, 9);
    const newTask: Task = {
      ...data,
      id,
      userId,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };
    tasks.push(newTask);
    setLocalStorageItem("notfit_mock_tasks", tasks);
    return id;
  }

  const ref = await addDoc(collection(db, "tasks"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getTasks = async (userId: string): Promise<Task[]> => {
  if (isMock) {
    const tasks = getLocalStorageItem<Task[]>("notfit_mock_tasks", []);
    return tasks
      .filter((t) => t.userId === userId)
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }

  const q = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
};

export const updateTask = async (id: string, data: Partial<Task>) => {
  if (isMock) {
    const tasks = getLocalStorageItem<Task[]>("notfit_mock_tasks", []);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...data } as Task;
      setLocalStorageItem("notfit_mock_tasks", tasks);
    }
    return;
  }

  await updateDoc(doc(db, "tasks", id), data);
};

export const deleteTask = async (id: string) => {
  if (isMock) {
    const tasks = getLocalStorageItem<Task[]>("notfit_mock_tasks", []);
    const filtered = tasks.filter((t) => t.id !== id);
    setLocalStorageItem("notfit_mock_tasks", filtered);
    return;
  }

  await deleteDoc(doc(db, "tasks", id));
};

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

export const addProgress = async (
  userId: string,
  data: Omit<ProgressEntry, "id" | "userId" | "createdAt">
) => {
  if (isMock) {
    const progress = getLocalStorageItem<ProgressEntry[]>("notfit_mock_progress", []);
    const id = "progress_" + Math.random().toString(36).substring(2, 9);
    const newProgress: ProgressEntry = {
      ...data,
      id,
      userId,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    } as any;
    progress.push(newProgress);
    setLocalStorageItem("notfit_mock_progress", progress);
    return id;
  }

  const ref = await addDoc(collection(db, "progress"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getProgress = async (userId: string): Promise<ProgressEntry[]> => {
  if (isMock) {
    const progress = getLocalStorageItem<ProgressEntry[]>("notfit_mock_progress", []);
    return progress
      .filter((p) => p.userId === userId)
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  }

  const q = query(
    collection(db, "progress"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressEntry));
};

export const updateProgress = async (id: string, data: Partial<ProgressEntry>) => {
  if (isMock) {
    const progress = getLocalStorageItem<ProgressEntry[]>("notfit_mock_progress", []);
    const idx = progress.findIndex((p) => p.id === id);
    if (idx !== -1) {
      progress[idx] = { ...progress[idx], ...data } as ProgressEntry;
      setLocalStorageItem("notfit_mock_progress", progress);
    }
    return;
  }

  await updateDoc(doc(db, "progress", id), data);
};

export const deleteProgress = async (id: string) => {
  if (isMock) {
    const progress = getLocalStorageItem<ProgressEntry[]>("notfit_mock_progress", []);
    const filtered = progress.filter((p) => p.id !== id);
    setLocalStorageItem("notfit_mock_progress", filtered);
    return;
  }

  await deleteDoc(doc(db, "progress", id));
};

export const getAllWorkouts = async (): Promise<Workout[]> => {
  if (isMock) {
    return getLocalStorageItem<Workout[]>("notfit_mock_workouts", []);
  }
  const snap = await getDocs(collection(db, "workouts"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workout));
};

export const getAllTasks = async (): Promise<Task[]> => {
  if (isMock) {
    return getLocalStorageItem<Task[]>("notfit_mock_tasks", []);
  }
  const snap = await getDocs(collection(db, "tasks"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
};

export interface LibraryExercise {
  id?: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: string;
  icon: string;
  instructions: string;
  tips: string;
}

const SEED_EXERCISES: Omit<LibraryExercise, "id">[] = [
  { name: "Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], category: "Push", icon: "💪", instructions: "Lie flat, grip bar slightly wider than shoulder-width, lower to chest, press up explosively.", tips: "Keep shoulder blades retracted and feet flat on floor." },
  { name: "Incline Dumbbell Press", primaryMuscle: "Upper Chest", secondaryMuscles: ["Triceps", "Shoulders"], category: "Push", icon: "🏋️", instructions: "Set bench to 30-45°, press dumbbells from shoulder level to full extension.", tips: "Control the descent. Don't let elbows flare too wide." },
  { name: "Shoulder Press", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Upper Chest"], category: "Push", icon: "⬆️", instructions: "Press barbell or dumbbells from shoulder level overhead until arms are fully extended.", tips: "Avoid arching your lower back. Engage core." },
  { name: "Lateral Raises", primaryMuscle: "Side Delts", secondaryMuscles: ["Traps"], category: "Push", icon: "🦅", instructions: "Raise dumbbells to the side until parallel to the floor, slight bend in elbows.", tips: "Lead with your elbows. Control the negative." },
  { name: "Tricep Pushdowns", primaryMuscle: "Triceps", secondaryMuscles: [], category: "Push", icon: "⬇️", instructions: "Keep elbows fixed at sides, push cable bar down until arms are fully extended.", tips: "Full extension at bottom for peak contraction." },
  { name: "Deadlift", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Lower Back", "Traps", "Lats"], category: "Pull", icon: "🏋️", instructions: "Hip-width stance, bar over mid-foot, hinge hips back, pull bar along legs.", tips: "Push the floor away instead of pulling up. Neutral spine." },
  { name: "Lat Pulldown", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts"], category: "Pull", icon: "🔽", instructions: "Grip bar wider than shoulder-width, pull to upper chest, squeeze lats at bottom.", tips: "Lean back slightly. Drive elbows down and back." },
  { name: "Barbell Row", primaryMuscle: "Mid Back", secondaryMuscles: ["Lats", "Biceps", "Rear Delts"], category: "Pull", icon: "🔙", instructions: "Hip hinge position, pull bar to lower chest/upper abdomen, retract shoulder blades.", tips: "Keep back parallel to floor. Squeeze at top." },
  { name: "Bicep Curls", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], category: "Pull", icon: "💪", instructions: "Stand with dumbbells, curl with supination, squeeze at top, lower slowly.", tips: "Keep elbows pinned to sides. Full range of motion." },
  { name: "Squat", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings", "Core"], category: "Legs", icon: "🦵", instructions: "Bar on upper traps, feet shoulder-width, squat until thighs parallel, drive through heels.", tips: "Knees track over toes. Chest up. Depth matters." },
  { name: "Romanian Deadlift", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Lower Back"], category: "Legs", icon: "🦵", instructions: "Stand with bar, hinge at hips while keeping slight knee bend, lower until hamstring stretch.", tips: "Push hips back, not down. Feel the hamstring stretch." },
  { name: "Leg Press", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], category: "Legs", icon: "🦿", instructions: "Feet shoulder-width on platform, lower until 90°, press through heels.", tips: "Don't lock out knees at top. Full range beats heavy weight." },
  { name: "Hip Thrust", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings", "Core"], category: "Legs", icon: "🍑", instructions: "Upper back on bench, bar on hips, drive through heels to full hip extension.", tips: "Posterior pelvic tilt at top. Squeeze glutes hard." },
  { name: "Calf Raises", primaryMuscle: "Calves", secondaryMuscles: [], category: "Legs", icon: "🦶", instructions: "Stand on edge of step, rise on toes fully, lower below platform level.", tips: "Full range of motion. Pause at top and bottom." },
  { name: "Pull-ups", primaryMuscle: "Lats", secondaryMuscles: ["Biceps", "Rear Delts", "Core"], category: "Pull", icon: "🤸", instructions: "Hang from bar, pull until chin above bar, lower with control.", tips: "Dead hang at bottom. No kipping for strength." },
  { name: "Plank", primaryMuscle: "Core", secondaryMuscles: ["Shoulders", "Glutes"], category: "Core", icon: "🧘", instructions: "Forearms on floor, body in straight line from head to heels.", tips: "Don't let hips sag or pike. Squeeze everything." },
];

export const getLibraryExercises = async (): Promise<LibraryExercise[]> => {
  if (isMock) {
    let list = getLocalStorageItem<LibraryExercise[]>("notfit_mock_library", []);
    if (!list || list.length === 0) {
      list = SEED_EXERCISES.map((ex, i) => ({
        id: `lib_${i}`,
        ...ex,
      }));
      setLocalStorageItem("notfit_mock_library", list);
    }
    return list;
  }

  const snap = await getDocs(collection(db, "library"));
  if (snap.empty) {
    const list: LibraryExercise[] = [];
    for (const ex of SEED_EXERCISES) {
      const ref = await addDoc(collection(db, "library"), ex);
      list.push({ id: ref.id, ...ex });
    }
    return list;
  }

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryExercise));
};

export const addLibraryExercise = async (data: Omit<LibraryExercise, "id">): Promise<string> => {
  if (isMock) {
    const list = getLocalStorageItem<LibraryExercise[]>("notfit_mock_library", []);
    const id = "lib_" + Math.random().toString(36).substring(2, 9);
    const newItem = { id, ...data };
    list.push(newItem);
    setLocalStorageItem("notfit_mock_library", list);
    return id;
  }

  const ref = await addDoc(collection(db, "library"), data);
  return ref.id;
};

export const updateLibraryExercise = async (id: string, data: Partial<LibraryExercise>): Promise<void> => {
  if (isMock) {
    const list = getLocalStorageItem<LibraryExercise[]>("notfit_mock_library", []);
    const idx = list.findIndex((ex) => ex.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setLocalStorageItem("notfit_mock_library", list);
    }
    return;
  }

  await updateDoc(doc(db, "library", id), data);
};

export const deleteLibraryExercise = async (id: string): Promise<void> => {
  if (isMock) {
    const list = getLocalStorageItem<LibraryExercise[]>("notfit_mock_library", []);
    const filtered = list.filter((ex) => ex.id !== id);
    setLocalStorageItem("notfit_mock_library", filtered);
    return;
  }

  await deleteDoc(doc(db, "library", id));
};

export interface PresetExercise {
  name: string;
  sets: {
    weight: number;
    reps: number;
    restTime: number;
  }[];
}

export interface PresetWorkout {
  id?: string;
  name: string;
  split: WorkoutSplit;
  exercises: PresetExercise[];
  createdBy: string;
  createdAt?: any;
}

export const getPresetWorkouts = async (): Promise<PresetWorkout[]> => {
  if (isMock) {
    return getLocalStorageItem<PresetWorkout[]>("notfit_mock_presets", []);
  }
  const snap = await getDocs(collection(db, "presets"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PresetWorkout));
};

export const createPresetWorkout = async (data: Omit<PresetWorkout, "id">): Promise<string> => {
  if (isMock) {
    const list = getLocalStorageItem<PresetWorkout[]>("notfit_mock_presets", []);
    const id = "preset_" + Math.random().toString(36).substring(2, 9);
    const newItem = { id, ...data };
    list.push(newItem);
    setLocalStorageItem("notfit_mock_presets", list);
    return id;
  }

  const ref = await addDoc(collection(db, "presets"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updatePresetWorkout = async (id: string, data: Partial<PresetWorkout>): Promise<void> => {
  if (isMock) {
    const list = getLocalStorageItem<PresetWorkout[]>("notfit_mock_presets", []);
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data } as PresetWorkout;
      setLocalStorageItem("notfit_mock_presets", list);
    }
    return;
  }

  await updateDoc(doc(db, "presets", id), data);
};

export const deletePresetWorkout = async (id: string): Promise<void> => {
  if (isMock) {
    const list = getLocalStorageItem<PresetWorkout[]>("notfit_mock_presets", []);
    const filtered = list.filter((p) => p.id !== id);
    setLocalStorageItem("notfit_mock_presets", filtered);
    return;
  }

  await deleteDoc(doc(db, "presets", id));
};

export const startWorkoutFromPreset = async (userId: string, preset: PresetWorkout): Promise<string> => {
  const workoutId = await createWorkout(userId, {
    date: new Date(),
    split: preset.split,
    duration: 0,
    notes: `Suggested Routine: ${preset.name}`,
    exerciseCount: preset.exercises.length,
    totalVolume: 0,
  });

  for (let i = 0; i < preset.exercises.length; i++) {
    const ex = preset.exercises[i];
    await addExercise(workoutId, {
      name: ex.name,
      sets: ex.sets.map((s) => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 10,
        restTime: Number(s.restTime) || 90,
        completed: false,
      })),
      order: i,
    });
  }

  return workoutId;
};
