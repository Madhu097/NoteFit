"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getAllUserProfiles } from "@/lib/firebase/auth";
import { getAllWorkouts, getAllTasks } from "@/lib/firebase/firestore";
import { UserProfile } from "@/types/auth";
import { Workout } from "@/types/workout";
import { Task } from "@/types/task";
import {
  Users, Dumbbell, CheckSquare, Shield, ShieldAlert,
  Search, Lock, ArrowLeft, Calendar, Mail, Flame, TrendingUp
} from "lucide-react";
import { formatWorkoutDate, formatVolume } from "@/lib/utils";
import Link from "next/link";

const GOAL_LABELS: Record<string, string> = {
  build_muscle: "Build Muscle 💪",
  gain_strength: "Gain Strength 🏋️",
  lose_fat: "Lose Fat 🔥",
  stay_fit: "Stay Fit ⚡",
};

export default function AdminDashboardPage() {
  const { profile, loading: authLoading, refreshProfile, user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin" || profile?.isAdmin === true;

  useEffect(() => {
    if (user && user.email?.toLowerCase() === "admin@notfit.com" && profile?.role !== "admin") {
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  useEffect(() => {
    if (isAdmin) {
      setLoadingData(true);
      setError(null);
      Promise.all([getAllUserProfiles(), getAllWorkouts(), getAllTasks()])
        .then(([allUsers, allWorkouts, allTasks]) => {
          setUsers(allUsers || []);
          setWorkouts(allWorkouts || []);
          setTasks(allTasks || []);
          setLoadingData(false);
        })
        .catch((err) => {
          console.error("Failed to load admin stats:", err);
          setError(
            typeof window !== "undefined" && window.navigator.onLine 
              ? "Missing Firestore permissions. Please ensure you have deployed the updated firestore.rules to your Firebase Console."
              : "Database synchronization required. You are currently offline, and member data is not cached locally."
          );
          setLoadingData(false);
        });
    }
  }, [isAdmin]);

  // Loading Screen
  if (authLoading || (isAdmin && loadingData)) {
    return (
      <div className="page-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Access Denied Padlock Screen
  if (!isAdmin) {
    return (
      <div className="page-container min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />
        <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-6 animate-bounce">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <div className="max-w-sm text-center glass-card p-6 border-destructive/20 relative z-10">
          <h1 className="font-display text-2xl font-black mb-2 text-destructive">Access Restricted</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This workspace is reserved for administrators only. If you believe this is an error, please log in with your administrative account credentials.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="neon-btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </Link>
            <Link href="/login" className="w-full py-3 bg-gym-charcoal border border-gym-border text-muted-foreground hover:text-foreground text-sm font-semibold rounded-xl transition-all">
              Sign In with Another Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered users for search query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (u.phoneNumber && u.phoneNumber.includes(q))
    );
  });

  // Calculate statistics
  const totalUsers = users.length;
  const totalWorkouts = workouts.length;
  const totalTasks = tasks.length;
  const adminCount = users.filter((u) => u.role === "admin" || u.isAdmin).length;

  // Goals Breakdown
  const goalsMap: Record<string, number> = { build_muscle: 0, gain_strength: 0, lose_fat: 0, stay_fit: 0 };
  users.forEach((u) => {
    if (u.fitnessGoal && goalsMap[u.fitnessGoal] !== undefined) {
      goalsMap[u.fitnessGoal]++;
    }
  });

  return (
    <div className="page-container min-h-screen pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="w-9 h-9 rounded-xl bg-gym-charcoal border border-gym-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-black text-gradient flex items-center gap-2">
              <Shield className="w-6 h-6 text-neon-green" /> Admin Panel
            </h1>
            <p className="text-muted-foreground text-sm">Overall membership insights & system logs</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border-destructive/30 bg-destructive/10 mb-6 flex items-start gap-3 animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-destructive flex-none mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-destructive">Data Loading Restricted</h4>
            <p className="text-muted-foreground text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="stat-card">
          <Users className="w-4 h-4 text-neon-green mb-1" />
          <p className="font-display text-2xl font-black text-neon-green">{totalUsers}</p>
          <p className="text-muted-foreground text-[10px]">Total Members</p>
        </div>
        <div className="stat-card">
          <Dumbbell className="w-4 h-4 text-neon-blue mb-1" />
          <p className="font-display text-2xl font-black text-neon-blue">{totalWorkouts}</p>
          <p className="text-muted-foreground text-[10px]">Workouts Logged</p>
        </div>
        <div className="stat-card">
          <CheckSquare className="w-4 h-4 text-purple-400 mb-1" />
          <p className="font-display text-2xl font-black text-purple-400">{totalTasks}</p>
          <p className="text-muted-foreground text-[10px]">Tasks Created</p>
        </div>
        <div className="stat-card">
          <ShieldAlert className="w-4 h-4 text-amber-400 mb-1" />
          <p className="font-display text-2xl font-black text-amber-400">{adminCount}</p>
          <p className="text-muted-foreground text-[10px]">Admins</p>
        </div>
      </div>

      {/* Goal Breakdowns & Activity summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Goals Chart */}
        <div className="glass-card p-5 lg:col-span-1">
          <h3 className="font-semibold text-sm mb-4">Fitness Goals Distribution</h3>
          <div className="flex flex-col gap-4">
            {Object.entries(goalsMap).map(([goalKey, count]) => {
              const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <div key={goalKey} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{GOAL_LABELS[goalKey] || "Other / None"}</span>
                    <span className="text-foreground">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gym-black rounded-full overflow-hidden border border-gym-border/30">
                    <div
                      className="h-full bg-neon-green rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System activity stats */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4">System Overall Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gym-black/40 border border-gym-border/50 rounded-2xl flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Average Workouts / Member</p>
              <p className="font-display text-2xl font-extrabold text-foreground">
                {totalUsers > 0 ? (totalWorkouts / totalUsers).toFixed(1) : 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Logged per registered account</p>
            </div>
            <div className="p-4 bg-gym-black/40 border border-gym-border/50 rounded-2xl flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Average Workout Duration</p>
              <p className="font-display text-2xl font-extrabold text-foreground">
                {totalWorkouts > 0
                  ? `${Math.round(workouts.reduce((acc, w) => acc + (w.duration || 0), 0) / totalWorkouts)}m`
                  : "0m"}
              </p>
              <p className="text-[10px] text-muted-foreground">Based on saved duration fields</p>
            </div>
            <div className="p-4 bg-gym-black/40 border border-gym-border/50 rounded-2xl flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Average Volume / Workout</p>
              <p className="font-display text-2xl font-extrabold text-foreground text-pr-gold">
                {totalWorkouts > 0
                  ? formatVolume(Math.round(workouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0) / totalWorkouts))
                  : "0 kg"}
              </p>
              <p className="text-[10px] text-muted-foreground">Accumulated set volume</p>
            </div>
            <div className="p-4 bg-gym-black/40 border border-gym-border/50 rounded-2xl flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Total Exercises Tracked</p>
              <p className="font-display text-2xl font-extrabold text-foreground">
                {workouts.reduce((acc, w) => acc + (w.exerciseCount || 0), 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Across all member sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Management List */}
      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-sm">Member Registrations ({filteredUsers.length})</h3>
          <div className="relative w-full md:w-64 flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full pl-9 pr-4 py-2 bg-gym-charcoal border border-gym-border rounded-xl text-xs text-foreground focus:outline-none focus:border-neon-green/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gym-border/50 text-muted-foreground font-semibold">
                <th className="pb-3 pr-4">Member</th>
                <th className="pb-3 px-4">Joined Date</th>
                <th className="pb-3 px-4">Goal</th>
                <th className="pb-3 px-4 text-center">Weight</th>
                <th className="pb-3 px-4 text-center">Workouts</th>
                <th className="pb-3 pl-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((member) => {
                  const memberWorkouts = workouts.filter((w) => w.userId === member.uid);
                  return (
                    <tr key={member.uid} className="border-b border-gym-border/30 last:border-0 hover:bg-gym-charcoal/20 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green font-bold text-xs">
                            {member.displayName ? member.displayName[0].toUpperCase() : "A"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{member.displayName || "Athlete"}</p>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" /> {member.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatWorkoutDate(member.createdAt)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize">
                          {member.fitnessGoal ? member.fitnessGoal.replace("_", " ") : "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">
                        {member.currentWeight ? `${member.currentWeight}kg` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="badge-green text-[10px] font-bold">
                          {memberWorkouts.length} logs
                        </span>
                      </td>
                      <td className="py-3.5 pl-4">
                        {member.role === "admin" || member.isAdmin ? (
                          <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            Admin
                          </span>
                        ) : (
                          <span className="text-muted-foreground bg-gym-charcoal border border-gym-border px-2 py-0.5 rounded text-[10px]">
                            User
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
