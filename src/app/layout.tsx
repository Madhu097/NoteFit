import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { PWAProvider } from "@/providers/PWAProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NoteFit – Track Every Rep. Beat Every Workout.",
    template: "%s | NoteFit",
  },
  description:
    "NoteFit is a modern fitness tracker that helps you log workouts, track progress, and beat your personal records. Built for gym-goers who want to get stronger every week.",
  keywords: ["fitness tracker", "workout log", "gym app", "progress tracking", "NoteFit"],
  authors: [{ name: "NoteFit" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-favicon.png",
    shortcut: "/icon-favicon.png",
    apple: "/icon-apple.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NoteFit",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${poppins.variable}`}>
      <body className="bg-gym-black text-foreground antialiased">
        <AuthProvider>
          <PWAProvider>
            {children}
            <Toaster
              theme="dark"
              position="top-center"
              toastOptions={{
                style: {
                  background: "hsl(240 6% 10%)",
                  border: "1px solid hsl(240 5% 18%)",
                  color: "hsl(0 0% 95%)",
                },
              }}
            />
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
