"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { usePWA } from "@/providers/PWAProvider";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useProgress } from "@/hooks/useProgress";
import { updateUserProfile, logOut, sendAdminPasswordReset, deleteUserAccount } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import {
  User, Scale, Target, Calendar, Dumbbell, TrendingUp,
  LogOut, Edit3, Save, X, Flame, ShieldAlert, Key, Download
} from "lucide-react";
import { cn, calculateStreak, formatVolume } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const GOALS = [
  { value: "build_muscle", label: "Build Muscle", icon: "💪" },
  { value: "gain_strength", label: "Gain Strength", icon: "🏋️" },
  { value: "lose_fat", label: "Lose Fat", icon: "🔥" },
  { value: "stay_fit", label: "Stay Fit", icon: "⚡" },
];

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { workouts } = useWorkouts();
  const { progress } = useProgress();
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState(String(profile?.currentWeight ?? ""));
  const [goal, setGoal] = useState(profile?.fitnessGoal ?? "build_muscle");

  // Deletion States
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const targetEmail = profile?.email || user?.email;
    if (confirmEmail !== targetEmail) {
      toast.error("Email verification failed. Please type your correct email.");
      return;
    }

    setDeleting(true);
    try {
      await deleteUserAccount(user.uid);
      toast.success("Account deleted successfully.");
      router.replace("/login");
    } catch (err: any) {
      console.error(err);
      if (err?.code === "auth/requires-recent-login" || err?.message?.includes("requires-recent-login")) {
        toast.error("Security verification required. Please sign out, sign back in, and try again.");
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const streak = calculateStreak(workouts, profile?.restDays ?? ["Sunday"]);
  const totalVolume = workouts.reduce((s, w) => s + w.totalVolume, 0);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        currentWeight: Number(weight),
        fitnessGoal: goal as any,
      });
      await refreshProfile();
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
    toast.success("Logged out successfully");
  };

  const handlePasswordReset = async () => {
    const email = profile?.email || user?.email;
    if (!email) return;
    try {
      await sendAdminPasswordReset(email);
      toast.success("Password reset email sent!");
    } catch {
      toast.error("Failed to send password reset email");
    }
  };

  return (
    <div className="page-container pb-24">
      {/* Profile header */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-neon-green/20 border-2 border-neon-green/40 flex items-center justify-center mb-3">
          <span className="font-display text-3xl font-black text-neon-green">
            {(profile?.displayName || user?.displayName || "Athlete")[0].toUpperCase()}
          </span>
        </div>
        <h1 className="font-display text-2xl font-black">{profile?.displayName || user?.displayName || "Athlete"}</h1>
        <p className="text-muted-foreground text-sm">{profile?.email || user?.email}</p>
        <span className="badge-green text-xs mt-2">
          {GOALS.find((g) => g.value === profile?.fitnessGoal)?.icon}{" "}
          {GOALS.find((g) => g.value === profile?.fitnessGoal)?.label ?? "Athlete"}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
        <div className="stat-card items-center">
          <Flame className="w-4 h-4 text-orange-400 mb-1" />
          <p className="font-display text-2xl font-black text-orange-400">{streak}</p>
          <p className="text-muted-foreground text-[10px]">Day Streak</p>
        </div>
        <div className="stat-card items-center">
          <Dumbbell className="w-4 h-4 text-neon-green mb-1" />
          <p className="font-display text-2xl font-black text-neon-green">{workouts.length}</p>
          <p className="text-muted-foreground text-[10px]">Workouts</p>
        </div>
        <div className="stat-card items-center">
          <TrendingUp className="w-4 h-4 text-neon-blue mb-1" />
          <p className="font-display text-lg font-black text-neon-blue">{formatVolume(totalVolume)}</p>
          <p className="text-muted-foreground text-[10px]">Volume</p>
        </div>
      </div>

      {/* Admin Panel Card */}
      {(profile?.role === "admin" || profile?.isAdmin) && (
        <div className="glass-card p-4 border-neon-green/30 mb-4 animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center flex-none">
              <ShieldAlert className="w-4 h-4 text-neon-green" />
            </div>
            <div>
              <p className="font-semibold text-sm">Admin Access Enabled</p>
              <p className="text-muted-foreground text-xs">Manage system-wide logs & statistics</p>
            </div>
          </div>
          <Link href="/admin" className="badge-green px-3 py-1.5 text-xs font-semibold">
            Admin Panel
          </Link>
        </div>
      )}

      {/* Profile details */}
      <div className="glass-card p-4 mb-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Profile Settings</h3>
          <button
            onClick={() => {
              if (editing) {
                setWeight(String(profile?.currentWeight ?? ""));
                setGoal(profile?.fitnessGoal ?? "build_muscle");
              }
              setEditing(!editing);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-green hover:bg-neon-green/10 transition-all"
          >
            {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>

        {editing ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Current Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 bg-gym-black border border-gym-border rounded-xl text-sm focus:outline-none focus:border-neon-green/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Fitness Goal</label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value as any)}
                    className={cn(
                      "py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                      goal === g.value
                        ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                        : "bg-gym-black border-gym-border text-muted-foreground"
                    )}
                  >
                    {g.icon} {g.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="neon-btn w-full py-3 flex items-center justify-center gap-2 font-bold disabled:opacity-40"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[
              { icon: Scale, label: "Current Weight", value: `${profile?.currentWeight ?? "—"} kg` },
              { icon: Target, label: "Fitness Goal", value: GOALS.find((g) => g.value === profile?.fitnessGoal)?.label ?? "—" },
              { icon: Calendar, label: "Training Frequency", value: `${profile?.workoutFrequency ?? "—"} days/week` },
              { icon: User, label: "Rest Days", value: profile?.restDays?.join(", ") ?? "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gym-muted flex items-center justify-center flex-none">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="font-medium text-sm">{value}</p>
                </div>
              </div>
            ))}

            {/* Password Reset */}
            <div className="border-t border-gym-border/40 pt-4 mt-2">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="w-full py-2 bg-gym-charcoal border border-gym-border text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Key className="w-3.5 h-3.5" />
                Send Password Reset Email
              </button>
            </div>

            {/* PWA Installation */}
            {!isInstalled && (isInstallable || isIOS) && (
              <div className="border-t border-gym-border/40 pt-4 mt-1">
                <button
                  type="button"
                  onClick={installApp}
                  className="w-full py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5 animate-pulse" />
                  Install NoteFit App
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 text-sm font-medium transition-all animate-fade-in mb-4"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      {/* Danger Zone */}
      <div className="glass-card p-4 border-destructive/20 mb-12 animate-fade-in">
        <h3 className="font-semibold text-sm text-destructive mb-2">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Deleting your account will permanently remove your profile, workouts, history, tasks, and notes from our database. This action is irreversible.
        </p>
        
        {confirmDelete ? (
          <div className="flex flex-col gap-2 animate-slide-up">
            <p className="text-[10px] text-destructive font-black tracking-wider uppercase">
              ⚠️ Are you absolutely sure? Type your email to confirm deletion:
            </p>
            <input
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={profile?.email || user?.email || ""}
              className="w-full px-4 py-2.5 bg-gym-black border border-destructive/30 rounded-xl text-sm focus:outline-none focus:border-destructive text-foreground placeholder:text-muted-foreground/45"
            />
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setConfirmEmail("");
                }}
                className="flex-1 py-2 rounded-xl border border-gym-border text-muted-foreground text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmEmail !== (profile?.email || user?.email)}
                className="flex-1 py-2 bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/35 disabled:opacity-40 disabled:hover:bg-destructive/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border border-destructive/30 border-t-destructive rounded-full animate-spin" />
                ) : (
                  "Delete My Account"
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 text-xs font-bold transition-all"
          >
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
}
