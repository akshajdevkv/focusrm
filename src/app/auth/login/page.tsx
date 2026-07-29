import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="gloss-page grid min-h-screen place-items-center px-6">
      <div className="gloss-panel w-full max-w-md rounded-lg p-6">
        <h1 className="text-2xl font-black">Log in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue to your Focus Room workspace.
        </p>
        <AuthForm mode="login" />
        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
        ) : null}
        <p className="mt-5 text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-bold text-primary" href="/auth/signup">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
