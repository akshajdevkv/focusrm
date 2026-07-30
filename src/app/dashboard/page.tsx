import { redirect } from "next/navigation";
import { StudyDashboard } from "@/features/dashboard/study-dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const rawName = [
    user.user_metadata?.display_name,
    user.user_metadata?.full_name,
    user.user_metadata?.name
  ].find((value) => typeof value === "string" && value.trim());
  const emailName = user.email?.split("@")[0].replace(/[._-]+/g, " ").trim();
  const userName = typeof rawName === "string"
    ? rawName.trim().split(/\s+/)[0]
    : emailName
      ? emailName.charAt(0).toLocaleUpperCase() + emailName.slice(1)
      : "Learner";
  return <StudyDashboard userName={userName} />;
}
