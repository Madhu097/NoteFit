import ActiveWorkoutPageClient from "../session/page";

export function generateStaticParams() {
  return [];
}

export default function WorkoutSessionWrapperPage() {
  return <ActiveWorkoutPageClient />;
}

