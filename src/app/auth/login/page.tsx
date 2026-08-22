import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/features/auth/auth-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
    redirectTo?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;
  const requestedNext = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;
  const nextPath = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";

  return (
    <div className="gloss-page flex min-h-screen flex-col">
      <main className="grid min-h-screen flex-1 place-items-center px-6 py-16">
        <div className="gloss-panel w-full max-w-md rounded-lg p-6">
        <h1 className="text-2xl font-black">Log in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue to your Focus Room workspace.
        </p>
        <AuthForm mode="login" nextPath={nextPath} />
        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm font-semibold text-green-700">{message}</p>
        ) : null}
        <p className="mt-5 text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-bold text-primary" href="/auth/signup">
            Create an account
          </Link>
        </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
