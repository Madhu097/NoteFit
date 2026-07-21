"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { usePWA } from "@/providers/PWAProvider";
import { logOut } from "@/lib/firebase/auth";
import {
  Home, Dumbbell, TrendingUp, BookOpen, Menu, X,
  Calendar, StickyNote, CheckSquare, ClipboardList,
  User, ShieldAlert, LogOut, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/library", label: "Library", icon: BookOpen },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logOut();
      setMenuOpen(false);
      router.replace("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const isAdmin = profile?.role === "admin" || profile?.isAdmin === true;

  const moreMenuItems = [
    { href: "/profile", label: "Profile Settings", icon: User, desc: "Edit goals & preferences" },
    { href: "/calendar", label: "Calendar", icon: Calendar, desc: "Workout schedule" },
    { href: "/history", label: "Workout History", icon: ClipboardList, desc: "Logs & past sessions" },
    { href: "/notes", label: "Training Notes", icon: StickyNote, desc: "Jot down workout details" },
    { href: "/tasks", label: "Task List", icon: CheckSquare, desc: "Track daily workout tasks" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: ShieldAlert, desc: "System administration" }] : [])
  ];

  const isMoreActive =
    menuOpen ||
    moreMenuItems.some(({ href }) => pathname === href || pathname.startsWith(href));

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div
          className="border-t border-white/[0.06]"
          style={{ background: "rgba(10,10,10,0.97)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center justify-around px-1 py-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
            {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 px-1 py-1.5 rounded-xl transition-all duration-200 min-w-[50px]",
                    active ? "text-white" : "text-white/35 hover:text-white/60"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                      active && "bg-white/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "transition-all duration-200",
                        active ? "w-5 h-5" : "w-4.5 h-4.5"
                      )}
                    />
                  </div>
                  <span className={cn("text-[10px] font-semibold tracking-wide", active && "text-white")}>{label}</span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 px-1 py-1.5 rounded-xl transition-all duration-200 min-w-[50px]",
                isMoreActive ? "text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              <div
                className={cn(
                  "w-10 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  isMoreActive && "bg-white/10"
                )}
              >
                <Menu className={cn("transition-all duration-200", isMoreActive ? "w-5 h-5" : "w-4.5 h-4.5")} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">More</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[60] md:hidden animate-fade-in"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        />
      )}

      {/* Drawer */}
      {menuOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 max-h-[88vh] rounded-t-3xl z-[70] flex flex-col p-5 md:hidden animate-slide-up"
          style={{
            background: "#111111",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 -24px 60px rgba(0,0,0,0.6)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)"
          }}
        >
          {/* User Profile Header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-sm flex-none">
              {(profile?.displayName || user?.displayName || "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white">
                {profile?.displayName || user?.displayName || "Athlete"}
              </p>
              <p className="text-white/40 text-xs truncate">{profile?.email || user?.email}</p>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white transition-all duration-150 flex-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[45vh] pr-0.5">
            {moreMenuItems.map(({ href, label, icon: Icon, desc }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl transition-all duration-150",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 flex-none",
                    active ? "bg-white/15 text-white" : "bg-white/[0.05] text-white/40"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-white/35 truncate">{desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-2">
            {isInstallable && (
              <button
                onClick={() => { installApp(); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs text-white bg-white/10 border border-white/15 hover:bg-white/[0.15] transition-all font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                Install NoteFit App
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs text-white/40 border border-white/[0.06] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
