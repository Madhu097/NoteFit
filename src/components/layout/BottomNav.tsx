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

  // More button is active if menu is open, or we are on any of the secondary pages
  const isMoreActive =
    menuOpen ||
    moreMenuItems.some(({ href }) => pathname === href || pathname.startsWith(href));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-gym-charcoal/95 backdrop-blur-lg border-t border-gym-border shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex items-center justify-around px-2 py-2 pb-safe">
            {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 px-1 py-1.5 rounded-xl transition-all duration-200 min-w-[50px]",
                    active
                      ? "text-neon-green"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                      active && "bg-neon-green/10"
                    )}
                  >
                    <Icon
                      className={cn("w-5 h-5 transition-all duration-200", active && "scale-110")}
                    />
                  </div>
                  <span className="text-[10px] font-semibold">{label}</span>
                </Link>
              );
            })}

            {/* More / Menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 px-1 py-1.5 rounded-xl transition-all duration-200 min-w-[50px]",
                isMoreActive
                  ? "text-neon-green"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "w-10 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  isMoreActive && "bg-neon-green/10"
                )}
              >
                <Menu
                  className={cn("w-5 h-5 transition-all duration-200", isMoreActive && "scale-110")}
                />
              </div>
              <span className="text-[10px] font-semibold">More</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden animate-fade-in"
        />
      )}

      {/* Drawer Container */}
      {menuOpen && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-gym-black border-t border-gym-border rounded-t-3xl z-[70] flex flex-col p-5 shadow-[0_-15px_40px_rgba(0,0,0,0.4)] md:hidden animate-slide-up pb-8">
          {/* User Profile Header */}
          <div className="flex items-center gap-3 border-b border-gym-border/40 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green font-bold text-sm">
              {(profile?.displayName || user?.displayName || "Athlete")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.displayName || user?.displayName || "Athlete"}</p>
              <p className="text-muted-foreground text-xs truncate">{profile?.email || user?.email}</p>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="ml-auto w-8 h-8 rounded-xl bg-gym-charcoal border border-gym-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable grid/list of links */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[45vh] pr-1">
            {moreMenuItems.map(({ href, label, icon: Icon, desc }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200",
                    active
                      ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                      : "bg-gym-charcoal border-gym-border text-foreground hover:bg-gym-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150",
                    active ? "bg-neon-green/20 text-neon-green" : "bg-gym-card border border-gym-border text-muted-foreground"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="mt-4 border-t border-gym-border/40 pt-4 flex flex-col gap-2">
            {isInstallable && (
              <button
                onClick={() => {
                  installApp();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs text-neon-green bg-neon-green/10 border border-neon-green/20 hover:bg-neon-green/20 transition-all font-bold"
              >
                <Download className="w-3.5 h-3.5 animate-bounce" />
                Install NoteFit App
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs text-muted-foreground border border-gym-border hover:text-destructive hover:bg-destructive/10 transition-all font-semibold"
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
