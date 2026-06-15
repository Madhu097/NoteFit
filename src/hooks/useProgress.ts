"use client";

import { useEffect, useState, useCallback } from "react";
import { getProgress, addProgress, updateProgress, deleteProgress } from "@/lib/firebase/firestore";
import { ProgressEntry } from "@/types/progress";
import { useAuth } from "@/providers/AuthProvider";
import { toDate } from "@/lib/utils";
import { toast } from "sonner";

const shouldShowError = (err: any) => {
  const isOffline = typeof window !== "undefined" && !window.navigator.onLine;
  if (isOffline || err?.code === "unavailable" || err?.message?.includes("unavailable")) {
    return false;
  }
  return true;
};

// Memory cache for progress entries to enable instant navigation loading
let progressCache: Record<string, ProgressEntry[]> = {};

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressEntry[]>(() => {
    return user ? progressCache[user.uid] || [] : [];
  });
  const [loading, setLoading] = useState(() => {
    return user ? !progressCache[user.uid] : true;
  });

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getProgress(user.uid);
      progressCache[user.uid] = data;
      setProgress(data);
    } catch (err: any) {
      // Silently fall back to cached data offline
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const logProgress = async (data: Omit<ProgressEntry, "id" | "userId" | "createdAt">) => {
    if (!user) return;
    const tempId = "temp_" + Math.random().toString(36).substring(2, 9);
    const newEntry: ProgressEntry = {
      ...data,
      id: tempId,
      userId: user.uid,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    // Optimistically add and sort by date descending
    const addAndSort = (prev: ProgressEntry[]) => 
      [newEntry, ...prev].sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());

    setProgress((prev) => addAndSort(prev));
    progressCache[user.uid] = addAndSort(progressCache[user.uid] || []);

    addProgress(user.uid, data)
      .then((actualId) => {
        setProgress((prev) =>
          prev.map((p) => (p.id === tempId ? { ...p, id: actualId } : p))
        );
        if (progressCache[user.uid]) {
          progressCache[user.uid] = progressCache[user.uid].map((p) =>
            p.id === tempId ? { ...p, id: actualId } : p
          );
        }
        toast.success("Progress logged!");
      })
      .catch((err) => {
        setProgress((prev) => prev.filter((p) => p.id !== tempId));
        if (progressCache[user.uid]) {
          progressCache[user.uid] = progressCache[user.uid].filter((p) => p.id !== tempId);
        }
        if (shouldShowError(err)) {
          toast.error("Failed to log progress");
        }
      });
  };

  const editProgress = async (id: string, data: Partial<ProgressEntry>) => {
    if (!user) return;
    let originalProgress: ProgressEntry[] = [];

    const updateAndSort = (prev: ProgressEntry[]) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
        .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());

    setProgress((prev) => {
      originalProgress = prev;
      return updateAndSort(prev);
    });
    progressCache[user.uid] = updateAndSort(progressCache[user.uid] || []);

    updateProgress(id, data)
      .then(() => {
        toast.success("Progress updated!");
      })
      .catch((err) => {
        setProgress(originalProgress);
        if (progressCache[user.uid]) {
          progressCache[user.uid] = originalProgress;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to update progress");
        }
      });
  };

  const removeProgress = async (id: string) => {
    if (!user) return;
    let originalProgress: ProgressEntry[] = [];

    setProgress((prev) => {
      originalProgress = prev;
      return prev.filter((p) => p.id !== id);
    });
    const cachedProgress = progressCache[user.uid] || [];
    progressCache[user.uid] = cachedProgress.filter((p) => p.id !== id);

    deleteProgress(id)
      .then(() => {
        toast.success("Entry deleted");
      })
      .catch((err) => {
        setProgress(originalProgress);
        if (progressCache[user.uid]) {
          progressCache[user.uid] = cachedProgress;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to delete entry");
        }
      });
  };

  return { progress, loading, logProgress, editProgress, removeProgress };
}
