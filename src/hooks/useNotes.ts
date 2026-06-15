"use client";

import { useEffect, useState, useCallback } from "react";
import { getNotes, createNote, updateNote, deleteNote } from "@/lib/firebase/firestore";
import { Note } from "@/types/note";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

const shouldShowError = (err: any) => {
  const isOffline = typeof window !== "undefined" && !window.navigator.onLine;
  if (isOffline || err?.code === "unavailable" || err?.message?.includes("unavailable")) {
    return false;
  }
  return true;
};

// Memory cache for notes to enable instant navigation loading
let notesCache: Record<string, Note[]> = {};

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>(() => {
    return user ? notesCache[user.uid] || [] : [];
  });
  const [loading, setLoading] = useState(() => {
    return user ? !notesCache[user.uid] : true;
  });

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotes(user.uid);
      notesCache[user.uid] = data;
      setNotes(data);
    } catch (err: any) {
      // Silently fall back to cached data offline
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (data: { title: string; content: string }) => {
    if (!user) return;
    const tempId = "temp_" + Math.random().toString(36).substring(2, 9);
    const now = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any;
    const newNote: Note = {
      id: tempId,
      userId: user.uid,
      title: data.title,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };

    // Update local state instantly
    setNotes((prev) => [newNote, ...prev]);
    notesCache[user.uid] = [newNote, ...(notesCache[user.uid] || [])];

    createNote(user.uid, data)
      .then((actualId) => {
        setNotes((prev) =>
          prev.map((n) => (n.id === tempId ? { ...n, id: actualId } : n))
        );
        if (notesCache[user.uid]) {
          notesCache[user.uid] = notesCache[user.uid].map((n) =>
            n.id === tempId ? { ...n, id: actualId } : n
          );
        }
        toast.success("Note saved!");
      })
      .catch((err) => {
        setNotes((prev) => prev.filter((n) => n.id !== tempId));
        if (notesCache[user.uid]) {
          notesCache[user.uid] = notesCache[user.uid].filter((n) => n.id !== tempId);
        }
        if (shouldShowError(err)) {
          toast.error("Failed to save note");
        }
      });
  };

  const editNote = async (id: string, data: { title: string; content: string }) => {
    if (!user) return;
    let originalNotes: Note[] = [];
    const now = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any;

    setNotes((prev) => {
      originalNotes = prev;
      return prev.map((n) => (n.id === id ? { ...n, ...data, updatedAt: now } : n));
    });
    notesCache[user.uid] = (notesCache[user.uid] || []).map((n) =>
      n.id === id ? { ...n, ...data, updatedAt: now } : n
    );

    updateNote(id, data)
      .then(() => {
        toast.success("Note updated!");
      })
      .catch((err) => {
        setNotes(originalNotes);
        if (notesCache[user.uid]) {
          notesCache[user.uid] = originalNotes;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to update note");
        }
      });
  };

  const removeNote = async (id: string) => {
    if (!user) return;
    let originalNotes: Note[] = [];

    setNotes((prev) => {
      originalNotes = prev;
      return prev.filter((n) => n.id !== id);
    });
    const cachedNotes = notesCache[user.uid] || [];
    notesCache[user.uid] = cachedNotes.filter((n) => n.id !== id);

    deleteNote(id)
      .then(() => {
        toast.success("Note deleted");
      })
      .catch((err) => {
        setNotes(originalNotes);
        if (notesCache[user.uid]) {
          notesCache[user.uid] = cachedNotes;
        }
        if (shouldShowError(err)) {
          toast.error("Failed to delete note");
        }
      });
  };

  return { notes, loading, addNote, editNote, removeNote };
}
