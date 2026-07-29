"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm({ mode }: { mode: "request" | "update" }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);

    if (mode === "request") {
      const callbackUrl = new URL("/auth/callback", location.origin);
      callbackUrl.searchParams.set("next", "/auth/reset-password?mode=update");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl.toString()
      });
      setMessage(
        error
          ? error.message
          : "If an account exists for this email, a password reset link has been sent."
      );
      setPending(false);
      return;
    }

    if (password.length < 8) {
      setMessage("Use at least 8 characters for your new password.");
      setPending(false);
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      setPending(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setPending(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/auth/login?message=Password%20updated.%20You%20can%20now%20sign%20in.");
    router.refresh();
  }

  return (
    <form className="mt-6 grid gap-3" onSubmit={submit}>
      {mode === "request" ? (
        <Input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />
      ) : (
        <>
          <Input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            required
            type="password"
            value={password}
          />
          <Input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Confirm new password"
            required
            type="password"
            value={confirmation}
          />
        </>
      )}
      <Button disabled={pending} type="submit">
        {pending
          ? "Please wait…"
          : mode === "request"
            ? "Send reset link"
            : "Update password"}
      </Button>
      {message ? (
        <p aria-live="polite" className="text-sm font-semibold text-muted-foreground">
          {message}
        </p>
      ) : null}
      <Link className="mt-2 text-center text-sm font-semibold text-primary hover:underline" href="/auth/login">
        Back to login
      </Link>
    </form>
  );
}
