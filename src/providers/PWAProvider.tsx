"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  installApp: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  installApp: async () => false,
});

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone display mode (already installed)
    const checkStandalone = () => {
      if (typeof window === "undefined") return;
      
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // 2. Check for iOS device
    const checkIOS = () => {
      if (typeof window === "undefined") return;
      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      setIsIOS(isIosDevice);
      
      // On iOS, display-mode might not be standalone but we still check if navigated from homescreen
      if (isIosDevice && (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    };
    checkIOS();

    // 3. Monitor standalone media query changes
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(display-mode: standalone)");
      const handleDisplayModeChange = (e: MediaQueryListEvent) => {
        setIsInstalled(e.matches);
      };
      
      try {
        mediaQuery.addEventListener("change", handleDisplayModeChange);
      } catch (err) {
        // Fallback for older browsers
        mediaQuery.addListener(handleDisplayModeChange);
      }

      // 4. Listen for browser install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        // Save the event for manual trigger later
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      // 5. Listen for successful installation event
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        toast.success("NoteFit has been successfully installed on your device!");
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      // 6. Register Service Worker (in both dev & prod to facilitate local PWA testing)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("[PWA] Service Worker registration failed:", error);
          });
      }

      return () => {
        try {
          mediaQuery.removeEventListener("change", handleDisplayModeChange);
        } catch (err) {
          mediaQuery.removeListener(handleDisplayModeChange);
        }
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      if (isIOS) {
        toast("Install NoteFit App", {
          description: "Tap the 'Share' icon in Safari and choose 'Add to Home Screen' to install NoteFit on your iPhone/iPad.",
          duration: 6000,
        });
      } else {
        toast.info("NoteFit is already installed or install prompt is not supported by your browser.");
      }
      return false;
    }

    try {
      // Trigger the prompt
      deferredPrompt.prompt();
      
      // Wait for response
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response to install prompt: ${outcome}`);
      
      if (outcome === "accepted") {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (error) {
      console.error("[PWA] Failed to trigger install prompt:", error);
    }
    
    return false;
  };

  return (
    <PWAContext.Provider value={{ isInstallable, isInstalled, isIOS, installApp }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext);
}
