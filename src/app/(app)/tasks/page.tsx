"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, TaskInput } from "@/lib/validations/workout";
import { CheckSquare, Plus, X, Trash2, Circle, Calendar } from "lucide-react";
import { toDate } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { tasks, loading, addTask, toggleTask, removeTask } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"pending" | "complete">("pending");

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", dueDate: null },
  });

  const onSubmit = async (data: TaskInput) => {
    await addTask({ title: data.title, dueDate: data.dueDate ?? null });
    reset();
    setShowForm(false);
  };

  const filtered = tasks.filter((t) => t.status === tab);

  return (
    <div className="page-container min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-black">Tasks</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green hover:bg-neon-green/20 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Add task form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-card p-4 mb-6 animate-slide-up"
        >
          <h3 className="font-semibold text-sm mb-3">New Task</h3>
          <div className="flex flex-col gap-3">
            <input
              {...register("title")}
              placeholder="Task title..."
              className="w-full px-4 py-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
            />
            <input
              {...register("dueDate", { valueAsDate: true })}
              type="date"
              className="w-full px-4 py-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 transition-colors text-muted-foreground"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gym-border text-muted-foreground text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="neon-btn flex-1 py-2.5 text-sm font-bold disabled:opacity-40"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["pending", "complete"] as const).map((t) => {
          const count = tasks.filter((task) => task.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all capitalize",
                tab === t
                  ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                  : "bg-gym-charcoal border-gym-border text-muted-foreground"
              )}
            >
              {t} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gym-card/50 border border-gym-border/50 rounded-2xl px-4 py-3 flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-gym-muted flex-none" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gym-muted rounded-md w-3/4" />
                <div className="h-3 bg-gym-muted rounded-md w-1/4" />
              </div>
              <div className="w-7 h-7 bg-gym-muted rounded-lg flex-none" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center gap-3">
          <CheckSquare className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center">
            {tab === "pending" ? "All done! No pending tasks." : "No completed tasks yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((task) => {
            const isOverdue =
              task.status === "pending" &&
              task.dueDate &&
              isPast(toDate(task.dueDate));

            return (
              <div
                key={task.id}
                className={cn(
                  "glass-card px-4 py-3 flex items-center gap-3 transition-all duration-200",
                  task.status === "complete" && "opacity-60",
                  isOverdue && "border-destructive/30"
                )}
              >
                <button
                  onClick={() => task.id && task.status && toggleTask(task.id, task.status)}
                  className="flex-none"
                >
                  {task.status === "complete" ? (
                    <div className="w-6 h-6 rounded-full bg-neon-green flex items-center justify-center">
                      <span className="text-black text-xs font-bold">✓</span>
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground hover:text-neon-green transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", task.status === "complete" && "line-through text-muted-foreground")}>
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className={cn("text-xs flex items-center gap-1 mt-0.5", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                      <Calendar className="w-3 h-3" />
                      {format(toDate(task.dueDate), "dd MMM yyyy")}
                      {isOverdue && " · Overdue"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => task.id && removeTask(task.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
