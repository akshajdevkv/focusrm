"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const nextPath = "/";

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
      <Button type="button" onClick={submit} disabled={pending}>
        {pending ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
      </Button>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
    </div>
  );
}
