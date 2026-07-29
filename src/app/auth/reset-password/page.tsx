import { SiteFooter } from "@/components/site-footer";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const params = await searchParams;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const updatingPassword = mode === "update";

  return (
    <div className="gloss-page flex min-h-screen flex-col">
      <main className="grid min-h-screen flex-1 place-items-center px-6 py-16">
        <div className="gloss-panel w-full max-w-md rounded-lg p-6">
        <h1 className="text-2xl font-black">
          {updatingPassword ? "Choose a new password" : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {updatingPassword
            ? "Enter and confirm the new password for your account."
            : "Enter your email and we’ll send you a secure reset link."}
        </p>
        <ResetPasswordForm mode={updatingPassword ? "update" : "request"} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
