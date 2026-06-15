"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWorkouts,
  getRecentWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getExercises,
  addExercise,
  updateExercise,
  deleteExercise,
} from "@/lib/firebase/firestore";
import { Workout, Exercise } from "@/types/workout";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

const shouldShowError = (err: any) => {
  const isOffline = typeof window !== "undefined" && !window.navigator.onLine;
  if (isOffline || err?.code === "unavailable" || err?.message?.includes("unavailable")) {
    return false;
  }
  return true;
};

// Memory cache for workouts to enable instant navigation loading
let workoutsCache: Record<string, Workout[]> = {};

export function useWorkouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    return user ? workoutsCache[user.uid] || [] : [];
  });
  const [loading, setLoading] = useState(() => {
    return user ? !workoutsCache[user.uid] : true;
  });

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getWorkouts(user.uid);
      workoutsCache[user.uid] = data;
      setWorkouts(data);
    } catch (err: any) {
      // Silently fall back to cached data offline
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const addWorkout = async (data: Omit<Workout, "id" | "userId" | "createdAt">) => {
    if (!user) return;
    try {
      const id = await createWorkout(user.uid, data);

      const newWorkout: Workout = {
        ...data,
        id,
        userId: user.uid,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      } as any;

      setWorkouts((prev) => [newWorkout, ...prev]);
      workoutsCache[user.uid] = [newWorkout, ...(workoutsCache[user.uid] || [])];

      fetchWorkouts(); // Fetch in background for sync
      toast.success("Workout created!");
      return id;
    } catch (err) {
      if (shouldShowError(err)) {
        toast.error("Failed to create workout");
      }
    }
  };

  const editWorkout = async (id: string, data: Partial<Workout>) => {
    if (!user) return;
    let originalWorkouts: Workout[] = [];

    setWorkouts((prev) => {
      originalWorkouts = prev;
      return prev.map((w) => (w.id === id ? { ...w, ...data } as Workout : w));
    });
    workoutsCache[user.uid] = (workoutsCache[user.uid] || []).map((w) =>
      w.id === id ? { ...w, ...data } as Workout : w
    );

    updateWorkout(id, data)
      .then(() => {
        toast.success("Workout updated!");
      })
      .catch((err) => {
        setWorkouts(originalWorkouts);
        if (workoutsCache[user.uid]) {
          workoutsCache[user.uid] = originalWorkouts;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to update workout");
        }
      });
  };

  const removeWorkout = async (id: string) => {
    if (!user) return;
    let originalWorkouts: Workout[] = [];

    setWorkouts((prev) => {
      originalWorkouts = prev;
      return prev.filter((w) => w.id !== id);
    });
    const cachedWorkouts = workoutsCache[user.uid] || [];
    workoutsCache[user.uid] = cachedWorkouts.filter((w) => w.id !== id);

    deleteWorkout(id)
      .then(() => {
        toast.success("Workout deleted");
      })
      .catch((err) => {
        setWorkouts(originalWorkouts);
        if (workoutsCache[user.uid]) {
          workoutsCache[user.uid] = cachedWorkouts;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to delete workout");
        }
      });
  };

  return { workouts, loading, addWorkout, editWorkout, removeWorkout, refetch: fetchWorkouts };
}

export function useExercises(workoutId: string | null) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExercises = useCallback(async () => {
    if (!workoutId) return;
    setLoading(true);
    try {
      const data = await getExercises(workoutId);
      setExercises(data);
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const addEx = async (data: Omit<Exercise, "id">) => {
    if (!workoutId) return;
    try {
      const id = await addExercise(workoutId, data);
      const newEx: Exercise = {
        ...data,
        id,
      };

      setExercises((prev) => 
        [...prev, newEx].sort((a, b) => a.order - b.order)
      );

      fetchExercises(); // Background refresh
      return id;
    } catch (err) {
      if (shouldShowError(err)) {
        toast.error("Failed to add exercise");
      }
    }
  };

  const updateEx = async (exerciseId: string, data: Partial<Exercise>) => {
    if (!workoutId) return;
    const originalExercises = exercises;

    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, ...data } : e))
    );

    updateExercise(workoutId, exerciseId, data)
      .then(() => {
        fetchExercises(); // Background refresh
      })
      .catch((err) => {
        setExercises(originalExercises);
        if (shouldShowError(err)) {
          toast.error("Failed to update exercise");
        }
      });
  };

  const removeEx = async (exerciseId: string) => {
    if (!workoutId) return;
    const originalExercises = exercises;

    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));

    deleteExercise(workoutId, exerciseId)
      .then(() => {
        fetchExercises(); // Background refresh
      })
      .catch((err) => {
        setExercises(originalExercises);
        if (shouldShowError(err)) {
          toast.error("Failed to delete exercise");
        }
      });
  };

  return { exercises, loading, addEx, updateEx, removeEx, refetch: fetchExercises };
}
