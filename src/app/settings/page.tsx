import { AppSidebar } from "@/components/app-sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="gloss-page min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <AppSidebar active="Settings" />
      <main className="p-6 lg:p-8">
        <div className="gloss-panel mx-auto max-w-3xl rounded-lg p-6">
          <p className="text-sm font-bold uppercase text-primary">Settings</p>
          <h1 className="mt-1 text-3xl font-black">Account</h1>
          <dl className="mt-6 grid gap-4">
            <div>
              <dt className="text-sm font-bold text-muted-foreground">Email</dt>
              <dd className="mt-1 font-semibold">{user?.email || "Not signed in"}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted-foreground">User ID</dt>
              <dd className="mt-1 break-all font-mono text-sm">{user?.id || "Unavailable"}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
