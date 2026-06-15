import { z } from "zod";

export const signUpSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().regex(/^[0-9\-\+\s\(\)]{10,15}$/, "Invalid phone number").or(z.literal("")).optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or Mobile Number is required")
    .refine(
      (val) => {
        const isEmail = z.string().email().safeParse(val).success;
        const isPhone = /^[0-9\-\+\s\(\)]{10,15}$/.test(val);
        return isEmail || isPhone;
      },
      {
        message: "Must be a valid email or mobile number",
      }
    ),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  currentWeight: z.number().min(20).max(500),
  fitnessGoal: z.enum(["build_muscle", "gain_strength", "lose_fat", "stay_fit"]),
  workoutFrequency: z.number().min(1).max(7),
  restDays: z.array(z.string()),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
