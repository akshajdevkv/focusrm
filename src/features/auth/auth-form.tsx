"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode, redirectTo = "/workspace" }: { mode: "login" | "signup"; redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const nextPath = redirectTo.startsWith("/") ? redirectTo : "/workspace";

  async function submit() {
    setPending(true);
    setMessage("");
    const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: {
                product_name: "Focus Room"
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

  async function googleSignIn() {
    const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
  }

  return (
    <div className="mt-6 grid gap-3">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <Button type="button" onClick={submit} disabled={pending}>
        {pending ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
      </Button>
      <Button type="button" variant="outline" onClick={googleSignIn} disabled={pending}>
        Sign in with Google
      </Button>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
    </div>
  );
}
