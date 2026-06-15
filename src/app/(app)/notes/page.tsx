"use client";

import { useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noteSchema, NoteInput } from "@/lib/validations/workout";
import { Note } from "@/types/note";
import { Plus, X, Edit3, Trash2, StickyNote, Calendar } from "lucide-react";
import { toDate } from "@/lib/utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function NoteModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (data: NoteInput) => Promise<void>;
  initial?: Note;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: initial ? { title: initial.title, content: initial.content } : undefined,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gym-charcoal border border-gym-border rounded-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{initial ? "Edit Note" : "New Note"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(async (data) => { await onSave(data); onClose(); })} className="flex flex-col gap-3">
          <div>
            <input
              {...register("title")}
              placeholder="Note title..."
              className="w-full px-4 py-3 bg-gym-black border border-gym-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neon-green/50 transition-colors"
            />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <textarea
              {...register("content")}
              placeholder="Write your note here..."
              rows={5}
              className="w-full px-4 py-3 bg-gym-black border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 transition-colors resize-none"
            />
            {errors.content && <p className="text-destructive text-xs mt-1">{errors.content.message}</p>}
          </div>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gym-border text-muted-foreground text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="neon-btn flex-1 py-3 text-sm font-bold disabled:opacity-40">
              {isSubmitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { notes, loading, addNote, editNote, removeNote } = useNotes();
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  return (
    <div className="page-container min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-black">Notes</h1>
        <button
          onClick={() => { setEditingNote(null); setShowModal(true); }}
          className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green hover:bg-neon-green/20 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gym-card/50 border border-gym-border/50 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gym-muted rounded-md w-1/3" />
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-gym-muted rounded-lg" />
                  <div className="w-7 h-7 bg-gym-muted rounded-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gym-muted rounded-md w-full" />
                <div className="h-3 bg-gym-muted rounded-md w-5/6" />
              </div>
              <div className="h-3 bg-gym-muted rounded-md w-1/4 mt-2" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center gap-3">
          <StickyNote className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center">
            No notes yet.<br />Create your first note!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="badge-green px-4 py-1.5 text-xs"
          >
            Add Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {notes.map((note) => (
            <div key={note.id} className="glass-card p-4 hover:border-gym-muted transition-all duration-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm line-clamp-1">{note.title}</h3>
                <div className="flex items-center gap-1 flex-none">
                  <button
                    onClick={() => { setEditingNote(note); setShowModal(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-green hover:bg-neon-green/10 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => note.id && removeNote(note.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm line-clamp-3">{note.content}</p>
              <div className="flex items-center gap-1 mt-3 text-muted-foreground text-[10px]">
                <Calendar className="w-3 h-3" />
                {format(toDate(note.createdAt), "dd MMM yyyy")}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NoteModal
          onClose={() => { setShowModal(false); setEditingNote(null); }}
          initial={editingNote ?? undefined}
          onSave={async (data) => {
            if (editingNote?.id) {
              await editNote(editingNote.id, data);
            } else {
              await addNote(data);
            }
          }}
        />
      )}
    </div>
  );
}
