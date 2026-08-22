"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({
  mode,
  nextPath = "/dashboard"
}: {
  mode: "login" | "signup";
  nextPath?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const safeNextPath = nextPath.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/dashboard";

  async function continueWithGoogle() {
    setGooglePending(true);
    setMessage("");
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", safeNextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() }
    });

    if (error) {
      setMessage(error.message);
      setGooglePending(false);
    }
  }

  async function submit() {
    setPending(true);
    setMessage("");
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
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
      router.replace(safeNextPath);
      router.refresh();
      return;
    }

    setMessage("Account created, but email confirmation is still enabled in Supabase. Disable Confirm email to allow immediate access.");
    setPending(false);
  }

  return (
    <div className="mt-6 grid gap-3">
      <Button
        className="h-11 w-full"
        disabled={pending || googlePending}
        onClick={continueWithGoogle}
        type="button"
        variant="outline"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M21.6 12.23c0-.71-.06-1.23-.2-1.77H12v3.41h5.52a4.73 4.73 0 0 1-2.05 3.02l-.02.11 2.98 2.31.21.02c1.94-1.79 3.06-4.43 3.06-7.1Z" fill="#4285F4" />
          <path d="M12 22c2.7 0 4.97-.89 6.63-2.67l-3.17-2.44c-.85.57-2 1-3.46 1a5.99 5.99 0 0 1-5.67-4.14l-.1.01-3.1 2.4-.04.1A10 10 0 0 0 12 22Z" fill="#34A853" />
          <path d="M6.33 13.75A6.2 6.2 0 0 1 6 12c0-.61.11-1.2.32-1.75v-.12L3.18 7.7l-.1.05A10 10 0 0 0 2 12c0 1.54.35 3 .98 4.25l3.35-2.5Z" fill="#FBBC05" />
          <path d="M12 6.11c1.87 0 3.13.81 3.84 1.47l2.86-2.79C16.95 3.16 14.7 2 12 2a10 10 0 0 0-8.92 5.5l3.24 2.75A6.02 6.02 0 0 1 12 6.11Z" fill="#EA4335" />
        </svg>
        {googlePending ? "Connecting to Google…" : "Continue with Google"}
      </Button>
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        Or use email
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
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
      <Button type="button" onClick={submit} disabled={pending || googlePending}>
        {pending ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
      </Button>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
    </div>
  );
}
