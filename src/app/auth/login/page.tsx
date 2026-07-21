import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ redirectTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirectTo = Array.isArray(params.redirectTo) ? params.redirectTo[0] : params.redirectTo;

  return (
    <main className="gloss-page grid min-h-screen place-items-center px-6">
      <div className="gloss-panel w-full max-w-md rounded-lg p-6">
        <h1 className="text-2xl font-black">Log in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue to your Focus Room workspace.
        </p>
        <AuthForm mode="login" redirectTo={redirectTo} />
        <p className="mt-5 text-sm text-muted-foreground">
          New here?{" "}
          <Link
            className="font-bold text-primary"
            href={`/auth/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
