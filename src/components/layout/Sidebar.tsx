"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { usePWA } from "@/providers/PWAProvider";
import { logOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import {
  Home, Dumbbell, Calendar, TrendingUp, User,
  ClipboardList, StickyNote, LogOut, Zap, BookOpen, CheckSquare,
  ShieldAlert, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/history", label: "History", icon: ClipboardList },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logOut();
      router.replace("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const isAdmin = profile?.role === "admin" || profile?.isAdmin === true;
  const navItems = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: ShieldAlert }] : [])
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gym-charcoal border-r border-gym-border h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gym-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h1 className="font-display text-lg font-black text-gradient">NoteFit</h1>
            <p className="text-muted-foreground text-[10px]">Fitness Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-gym-muted/40"
              )}
            >
              <Icon className="w-4 h-4 flex-none" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gym-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green font-bold text-sm">
            {(profile?.displayName || user?.displayName || "Athlete")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.displayName || user?.displayName || "Athlete"}</p>
            <p className="text-muted-foreground text-xs truncate">{profile?.email || user?.email}</p>
          </div>
        </div>
        
        {isInstallable && (
          <button
            onClick={installApp}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 rounded-xl text-sm text-neon-green bg-neon-green/10 border border-neon-green/20 hover:bg-neon-green/20 transition-all duration-200 font-semibold"
          >
            <Download className="w-4 h-4 animate-bounce" />
            Install NoteFit App
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
