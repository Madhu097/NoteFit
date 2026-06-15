"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { updateUserProfile } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { ArrowRight, ChevronLeft, Target, Dumbbell, Scale, Calendar, Trophy, Flame, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type Goal = "build_muscle" | "gain_strength" | "lose_fat" | "stay_fit";

const GOALS: { value: Goal; label: string; icon: any; desc: string }[] = [
  { value: "build_muscle", label: "Build Muscle", icon: Dumbbell, desc: "Hypertrophy focused" },
  { value: "gain_strength", label: "Gain Strength", icon: Trophy, desc: "Powerlifting focused" },
  { value: "lose_fat", label: "Lose Fat", icon: Flame, desc: "Cut & lean out" },
  { value: "stay_fit", label: "Stay Fit", icon: Activity, desc: "General fitness" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FREQ = [3, 4, 5, 6];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [frequency, setFrequency] = useState(4);
  const [restDays, setRestDays] = useState<string[]>(["Sunday"]);

  const steps = [
    {
      title: "What's your current weight?",
      subtitle: "We'll track your progress over time",
      icon: <Scale className="w-7 h-7 text-neon-green" />,
    },
    {
      title: "What's your fitness goal?",
      subtitle: "We'll personalise your experience",
      icon: <Target className="w-7 h-7 text-neon-green" />,
    },
    {
      title: "How often do you train?",
      subtitle: "Set your weekly training frequency",
      icon: <Dumbbell className="w-7 h-7 text-neon-green" />,
    },
    {
      title: "Pick your rest days",
      subtitle: "Rest days won't break your streak",
      icon: <Calendar className="w-7 h-7 text-neon-green" />,
    },
  ];

  const canProceed = () => {
    if (step === 0) return weight && Number(weight) > 0;
    if (step === 1) return !!goal;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        currentWeight: Number(weight),
        fitnessGoal: goal!,
        workoutFrequency: frequency,
        restDays,
        onboardingComplete: true,
      });
      await refreshProfile();
      router.replace("/dashboard");
      toast.success("Welcome to NoteFit! Let's get stronger");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

      {/* Progress bar */}
      <div className="relative z-10 pt-safe">
        <div className="h-1 bg-gym-border">
          <div
            className="h-full bg-neon-green transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Step indicator */}
        <p className="text-muted-foreground text-xs mb-6 font-medium">
          STEP {step + 1} OF {steps.length}
        </p>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mb-4">
          {steps[step].icon}
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl font-bold text-center mb-2">{steps[step].title}</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">{steps[step].subtitle}</p>

        {/* Step content */}
        <div className="w-full max-w-sm">
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="75"
                  className="w-full px-4 py-4 bg-gym-charcoal border border-gym-border rounded-xl text-center text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green/50 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">kg</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={cn(
                      "split-card border flex flex-col items-center justify-center p-4 rounded-xl",
                      goal === g.value ? "selected border-neon-green/50" : "border-gym-border"
                    )}
                  >
                    <Icon className="w-8 h-8 text-neon-green mb-2" />
                    <span className="font-semibold text-sm text-center">{g.label}</span>
                    <span className="text-muted-foreground text-xs text-center">{g.desc}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-4 gap-3">
              {FREQ.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={cn(
                    "split-card border py-5",
                    frequency === f ? "selected border-neon-green/50" : "border-gym-border"
                  )}
                >
                  <span className="font-display text-2xl font-bold text-neon-green">{f}</span>
                  <span className="text-muted-foreground text-xs">days/wk</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              {DAYS.map((day) => {
                const selected = restDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() =>
                      setRestDays((prev) =>
                        selected ? prev.filter((d) => d !== day) : [...prev, day]
                      )
                    }
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between transition-all duration-200",
                      selected
                        ? "bg-rest-blue/10 border-rest-blue/50 text-rest-blue"
                        : "bg-gym-charcoal border-gym-border text-foreground hover:border-rest-blue/30"
                    )}
                  >
                    {day}
                    {selected && <span className="text-xs badge-blue">Rest Day</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="w-full max-w-sm mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-none px-4 py-3 rounded-xl border border-gym-border text-foreground hover:border-neon-green/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => (step < steps.length - 1 ? setStep((s) => s + 1) : handleFinish())}
            disabled={!canProceed() || loading}
            className="neon-btn flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : step < steps.length - 1 ? (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Let&apos;s Go!
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
