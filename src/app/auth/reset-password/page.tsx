import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="gloss-page grid min-h-screen place-items-center px-6">
      <div className="gloss-panel w-full max-w-md rounded-lg p-6">
        <h1 className="text-2xl font-black">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and Supabase Auth will send a reset link.
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
