import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/features/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="gloss-page flex min-h-screen flex-col">
      <main className="grid min-h-screen flex-1 place-items-center px-6 py-16">
        <div className="gloss-panel w-full max-w-md rounded-lg p-6">
        <h1 className="text-2xl font-black">Sign up</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account to save playlists, tasks, and study progress.
        </p>
        <AuthForm mode="signup" />
        <p className="mt-5 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-bold text-primary" href="/auth/login">
            Log in
          </Link>
        </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
