"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function authCallbackUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", location.origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

export function AuthForm({
  mode,
  showResendConfirmation = false
}: {
  mode: "login" | "signup";
  showResendConfirmation?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const nextPath = "/dashboard";

  async function submit() {
    setPending(true);
    setMessage("");
    const redirectTo = authCallbackUrl(nextPath);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: {
                product_name: "Focus Room",
                display_name: name.trim()
              }
            }
          });

    if (result.error) {
      setMessage(result.error.message);
      setPending(false);
      return;
    }

    if (mode === "login" || result.data.session) {
      router.replace(nextPath);
      router.refresh();
      return;
    }

    setMessage("Check your email to verify your Focus Room account.");
    setPending(false);
  }

  async function resendConfirmation() {
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }

    setPending(true);
    setMessage("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: authCallbackUrl(nextPath) }
    });
    setMessage(
      error
        ? error.message
        : "A new confirmation email has been sent. Please use the newest link."
    );
    setPending(false);
  }

  return (
    <div className="mt-6 grid gap-3">
      {mode === "signup" ? (
        <Input
          autoComplete="name"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      ) : null}
      <Input
        autoComplete="email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {mode === "login" ? (
        <Link className="justify-self-end text-sm font-semibold text-primary hover:underline" href="/auth/reset-password">
          Forgot password?
        </Link>
      ) : null}
      <Button type="button" onClick={submit} disabled={pending}>
        {pending ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
      </Button>
      {mode === "login" && showResendConfirmation ? (
        <Button disabled={pending} onClick={resendConfirmation} type="button" variant="outline">
          Resend confirmation email
        </Button>
      ) : null}
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
    </div>
  );
}
