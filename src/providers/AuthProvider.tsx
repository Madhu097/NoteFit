"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import { onAuthChange, getUserProfile } from "@/lib/firebase/auth";
import { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("notfit_cached_profile");
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      if (p) {
        setProfile(p);
        localStorage.setItem("notfit_cached_profile", JSON.stringify(p));
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Read from cache first, fetch from db concurrently to keep loading time low
        getUserProfile(firebaseUser.uid)
          .then((p) => {
            if (p) {
              setProfile(p);
              localStorage.setItem("notfit_cached_profile", JSON.stringify(p));
            }
          })
          .catch((err) => {
            console.warn("Failed to load profile (offline):", err);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setProfile(null);
        localStorage.removeItem("notfit_cached_profile");
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
