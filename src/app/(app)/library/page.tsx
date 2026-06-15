"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryExercise {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: string;
  icon: string;
  instructions: string;
  tips: string;
}

const EXERCISE_LIBRARY: LibraryExercise[] = [
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

const CATEGORIES = ["All", "Push", "Pull", "Legs", "Core"];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.primaryMuscle.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || ex.category === category;
      return matchSearch && matchCategory;
    });
  }, [search, category]);

  return (
    <div className="page-container min-h-screen">
      <h1 className="font-display text-2xl font-black mb-6">Exercise Library</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises or muscles..."
          className="w-full pl-10 pr-4 py-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              category === cat
                ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                : "bg-gym-charcoal border-gym-border text-muted-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs mb-4">{filtered.length} exercises</p>

      {/* Exercise list */}
      <div className="flex flex-col gap-2">
        {filtered.map((ex) => {
          const isOpen = expanded === ex.name;
          return (
            <div key={ex.name} className="glass-card overflow-hidden transition-all duration-200">
              <button
                onClick={() => setExpanded(isOpen ? null : ex.name)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center text-xl flex-none">
                  {ex.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{ex.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {ex.primaryMuscle} · {ex.category}
                  </p>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="border-t border-gym-border pt-3 flex flex-col gap-3">
                    {/* Muscles */}
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1.5">MUSCLES</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge-green text-[10px]">{ex.primaryMuscle}</span>
                        {ex.secondaryMuscles.map((m) => (
                          <span key={m} className="badge-blue text-[10px]">{m}</span>
                        ))}
                      </div>
                    </div>
                    {/* Instructions */}
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">INSTRUCTIONS</p>
                      <p className="text-sm text-foreground/80">{ex.instructions}</p>
                    </div>
                    {/* Tips */}
                    <div className="bg-pr-gold/5 border border-pr-gold/20 rounded-xl px-3 py-2">
                      <p className="text-xs text-pr-gold font-semibold mb-0.5">💡 TIP</p>
                      <p className="text-xs text-foreground/70">{ex.tips}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
