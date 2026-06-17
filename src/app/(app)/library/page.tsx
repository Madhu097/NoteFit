"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  getLibraryExercises, addLibraryExercise, updateLibraryExercise,
  deleteLibraryExercise, LibraryExercise
} from "@/lib/firebase/firestore";
import {
  Search, BookOpen, ChevronRight, Plus, Trash2, Edit3, X, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = ["All", "Push", "Pull", "Legs", "Core"];

export default function LibraryPage() {
  const { profile } = useAuth();
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Admin form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEx, setEditingEx] = useState<LibraryExercise | null>(null);
  
  // Form input fields
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [secondaryMusclesStr, setSecondaryMusclesStr] = useState("");
  const [exCategory, setExCategory] = useState("Push");
  const [icon, setIcon] = useState("💪");
  const [instructions, setInstructions] = useState("");
  const [tips, setTips] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.isAdmin === true;

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const list = await getLibraryExercises();
      setExercises(list || []);
    } catch (err) {
      toast.error("Failed to load exercise library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleOpenAddForm = () => {
    setName("");
    setPrimaryMuscle("");
    setSecondaryMusclesStr("");
    setExCategory("Push");
    setIcon("💪");
    setInstructions("");
    setTips("");
    setImage("");
    setEditingEx(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (ex: LibraryExercise) => {
    setEditingEx(ex);
    setName(ex.name);
    setPrimaryMuscle(ex.primaryMuscle);
    setSecondaryMusclesStr(ex.secondaryMuscles?.join(", ") || "");
    setExCategory(ex.category);
    setIcon(ex.icon || "💪");
    setInstructions(ex.instructions || "");
    setTips(ex.tips || "");
    setImage(ex.image || "");
    setShowAddForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !primaryMuscle.trim()) {
      toast.error("Name and Primary Muscle are required");
      return;
    }

    setSaving(true);
    const secondaryMuscles = secondaryMusclesStr
      ? secondaryMusclesStr.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const exerciseData = {
      name: name.trim(),
      primaryMuscle: primaryMuscle.trim(),
      secondaryMuscles,
      category: exCategory,
      icon,
      instructions: instructions.trim(),
      tips: tips.trim(),
      image: image.trim() || undefined,
    };

    try {
      if (editingEx) {
        // Update
        await updateLibraryExercise(editingEx.id!, exerciseData);
        toast.success("Exercise updated in library!");
        setEditingEx(null);
      } else {
        // Create
        await addLibraryExercise(exerciseData);
        toast.success("Exercise added to library!");
        setShowAddForm(false);
      }
      fetchLibrary();
    } catch {
      toast.error("Failed to save exercise");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this exercise from the library?")) return;
    try {
      await deleteLibraryExercise(id);
      toast.success("Exercise deleted from library");
      fetchLibrary();
    } catch {
      toast.error("Failed to delete exercise");
    }
  };

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.primaryMuscle.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || ex.category === category;
      return matchSearch && matchCategory;
    });
  }, [exercises, search, category]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, LibraryExercise[]> = {};
    filtered.forEach((ex) => {
      const muscle = ex.primaryMuscle;
      if (!groups[muscle]) {
        groups[muscle] = [];
      }
      groups[muscle].push(ex);
    });
    // Sort keys alphabetically so it reads nicely
    return Object.keys(groups)
      .sort()
      .reduce<Record<string, LibraryExercise[]>>((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filtered]);

  return (
    <div className="page-container pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-black">Exercise Library</h1>
          <p className="text-muted-foreground text-xs">Explore or add exercise movement logs</p>
        </div>
        {isAdmin && !showAddForm && !editingEx && (
          <button
            onClick={handleOpenAddForm}
            className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green hover:bg-neon-green/20 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Admin Add/Edit Form */}
      {isAdmin && (showAddForm || editingEx) && (
        <form onSubmit={handleSave} className="glass-card p-4 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4 border-b border-gym-border/40 pb-2">
            <h3 className="font-bold text-sm text-neon-green">
              {editingEx ? "Edit Exercise Details" : "Add New Library Exercise"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingEx(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground mb-1 block font-semibold">NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hammer Curls"
                  className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-green/50"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block font-semibold">ICON</label>
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="💪"
                  className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-center text-foreground focus:outline-none focus:border-neon-green/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block font-semibold">PRIMARY MUSCLE</label>
                <input
                  value={primaryMuscle}
                  onChange={(e) => setPrimaryMuscle(e.target.value)}
                  placeholder="e.g. Biceps"
                  className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-green/50"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block font-semibold">CATEGORY</label>
                <select
                  value={exCategory}
                  onChange={(e) => setExCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-green/50"
                >
                  <option value="Push">Push</option>
                  <option value="Pull">Pull</option>
                  <option value="Legs">Legs</option>
                  <option value="Core">Core</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block font-semibold">SECONDARY MUSCLES</label>
              <input
                value={secondaryMusclesStr}
                onChange={(e) => setSecondaryMusclesStr(e.target.value)}
                placeholder="Forearms, Brachialis (comma separated)"
                className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-green/50"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block font-semibold">INSTRUCTIONS</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Explain movement execution..."
                className="w-full h-16 p-2 bg-gym-charcoal border border-gym-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-green/50"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block font-semibold">TIPS / NOTES</label>
              <input
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                placeholder="e.g. Squeeze biceps at peak contraction"
                className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-green/50"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block font-semibold">IMAGE PATH / URL</label>
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="e.g. /images/bench_press.png"
                className="w-full px-3 py-2 bg-gym-charcoal border border-gym-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-green/50"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEx(null);
                }}
                className="flex-1 py-2 rounded-xl border border-gym-border text-muted-foreground text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 bg-neon-green/20 border border-neon-green/40 text-neon-green rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-neon-green/30 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises or muscles..."
          className="w-full pl-10 pr-4 py-3 bg-gym-charcoal border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50 transition-colors text-foreground"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
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

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-14 shimmer rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center gap-3">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center">No exercises found.</p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-xs mb-3">{filtered.length} exercises found</p>
          <div className="space-y-6">
            {Object.entries(groupedExercises).map(([muscleGroup, groupList]) => (
              <div key={muscleGroup} className="space-y-2.5 animate-fade-in">
                <h3 className="flex items-center gap-2 border-l-2 border-neon-green pl-2.5 py-0.5 text-neon-green/90 font-black text-xs tracking-wider mb-2 uppercase">
                  <span>{muscleGroup}</span>
                  <span className="text-[9px] bg-neon-green/10 border border-neon-green/20 px-1.5 py-0.5 rounded text-neon-green font-bold">
                    {groupList.length}
                  </span>
                </h3>
                
                <div className="flex flex-col gap-2">
                  {groupList.map((ex) => {
                    const isOpen = expanded === ex.name;
                    return (
                      <div key={ex.id || ex.name} className="glass-card overflow-hidden transition-all duration-200">
                        <div
                          onClick={() => setExpanded(isOpen ? null : ex.name)}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center text-xl flex-none">
                            {ex.icon || "💪"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{ex.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {ex.primaryMuscle} · {ex.category}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEditForm(ex)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-green hover:bg-neon-green/10 transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => ex.id && handleDelete(ex.id, e)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                          </div>
                        </div>

                        {isOpen && (
                          <div className="px-4 pb-4 animate-fade-in">
                            <div className="border-t border-gym-border pt-3 flex flex-col sm:grid sm:grid-cols-2 sm:gap-4 gap-3">
                              <div className="flex flex-col gap-3">
                                {/* Muscles */}
                                <div>
                                  <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 tracking-wider">TARGET MUSCLES</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="badge-green text-[10px]">Primary: {ex.primaryMuscle}</span>
                                    {ex.secondaryMuscles?.map((m) => (
                                      <span key={m} className="badge-blue text-[10px]">{m}</span>
                                    ))}
                                  </div>
                                </div>
                                {/* Instructions */}
                                {ex.instructions && (
                                  <div>
                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1 tracking-wider">HOW TO DO IT</p>
                                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{ex.instructions}</p>
                                  </div>
                                )}
                                {/* Tips */}
                                {ex.tips && (
                                  <div className="bg-pr-gold/5 border border-pr-gold/20 rounded-xl px-3 py-2">
                                    <p className="text-[10px] text-pr-gold font-semibold mb-0.5 tracking-wider">💡 COACH TIP</p>
                                    <p className="text-xs text-foreground/75 leading-relaxed">{ex.tips}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Illustration Image */}
                              {ex.image && (
                                <div className="relative w-full h-48 sm:h-auto min-h-[180px] rounded-xl overflow-hidden border border-gym-border bg-gym-card/40 flex items-center justify-center p-2 self-stretch">
                                  <img
                                    src={ex.image}
                                    alt={ex.name}
                                    className="object-contain w-full h-full max-h-[180px] sm:max-h-[220px] hover:scale-[1.05] transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
