"use client";

import { useEffect, useState, useCallback } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/firebase/firestore";
import { Task } from "@/types/task";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

const shouldShowError = (err: any) => {
  const isOffline = typeof window !== "undefined" && !window.navigator.onLine;
  if (isOffline || err?.code === "unavailable" || err?.message?.includes("unavailable")) {
    return false;
  }
  return true;
};

// Memory cache for tasks to enable instant navigation loading
let tasksCache: Record<string, Task[]> = {};

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => {
    return user ? tasksCache[user.uid] || [] : [];
  });
  const [loading, setLoading] = useState(() => {
    return user ? !tasksCache[user.uid] : true;
  });

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTasks(user.uid);
      tasksCache[user.uid] = data;
      setTasks(data);
    } catch (err: any) {
      // Silently fall back to cached data offline
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (data: { title: string; dueDate: Date | null }) => {
    if (!user) return;
    const tempId = "temp_" + Math.random().toString(36).substring(2, 9);
    const newTask: Task = {
      id: tempId,
      userId: user.uid,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) as any : null,
      status: "pending",
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    // Update local state instantly
    setTasks((prev) => [newTask, ...prev]);
    tasksCache[user.uid] = [newTask, ...(tasksCache[user.uid] || [])];

    // Trigger save in background
    createTask(user.uid, {
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) as any : null,
      status: "pending",
    })
      .then((actualId) => {
        // Replace tempId with actualId
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: actualId } : t))
        );
        if (tasksCache[user.uid]) {
          tasksCache[user.uid] = tasksCache[user.uid].map((t) =>
            t.id === tempId ? { ...t, id: actualId } : t
          );
        }
        toast.success("Task added!");
      })
      .catch((err) => {
        // Revert changes on failure
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        if (tasksCache[user.uid]) {
          tasksCache[user.uid] = tasksCache[user.uid].filter((t) => t.id !== tempId);
        }
        if (shouldShowError(err)) {
          toast.error("Failed to add task");
        }
      });
  };

  const toggleTask = async (id: string, current: "pending" | "complete") => {
    const nextStatus = current === "pending" ? "complete" : "pending";

    // Update local state instantly
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    if (user) {
      tasksCache[user.uid] = (tasksCache[user.uid] || []).map((t) =>
        t.id === id ? { ...t, status: nextStatus } : t
      );
    }

    // Trigger update in background
    updateTask(id, { status: nextStatus }).catch((err) => {
      // Revert status on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: current } : t))
      );
      if (user && tasksCache[user.uid]) {
        tasksCache[user.uid] = tasksCache[user.uid].map((t) =>
          t.id === id ? { ...t, status: current } : t
        );
      }
      if (shouldShowError(err)) {
        toast.error("Failed to update task");
      }
    });
  };

  const removeTask = async (id: string) => {
    if (!user) return;
    let originalTasks: Task[] = [];

    setTasks((prev) => {
      originalTasks = prev;
      return prev.filter((t) => t.id !== id);
    });

    const cachedTasks = (user ? tasksCache[user.uid] : null) || [];
    if (user) {
      tasksCache[user.uid] = cachedTasks.filter((t) => t.id !== id);
    }

    deleteTask(id)
      .then(() => {
        toast.success("Task removed");
      })
      .catch((err) => {
        // Revert on failure
        setTasks(originalTasks);
        if (tasksCache[user.uid]) {
          tasksCache[user.uid] = cachedTasks;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to remove task");
        }
      });
  };

  const editTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    let originalTasks: Task[] = [];

    const applyUpdates = (prev: Task[]) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t));

    setTasks((prev) => {
      originalTasks = prev;
      return applyUpdates(prev);
    });
    tasksCache[user.uid] = applyUpdates(tasksCache[user.uid] || []);

    updateTask(id, updates)
      .then(() => {
        toast.success("Task updated!");
      })
      .catch((err) => {
        setTasks(originalTasks);
        if (tasksCache[user.uid]) {
          tasksCache[user.uid] = originalTasks;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to update task");
        }
      });
  };

  return { tasks, loading, addTask, toggleTask, removeTask, editTask };
}
