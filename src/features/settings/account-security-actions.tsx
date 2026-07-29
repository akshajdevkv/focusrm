"use client";

import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountSecurityActions() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    if (!passwordDialogOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setPasswordDialogOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [passwordDialogOpen, pending]);

  function openPasswordDialog() {
    setPassword("");
    setConfirmation("");
    setMessage("");
    setPasswordDialogOpen(true);
  }

  function closePasswordDialog() {
    if (!pending) setPasswordDialogOpen(false);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setPassword("");
    setConfirmation("");
    setMessage("Password updated successfully.");
  }

  async function logout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6" aria-labelledby="password-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900" id="password-heading">Password</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Update the password used to access your account.
            </p>
          </div>
          <button
            className="w-fit text-sm font-semibold text-blue-600 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-800"
            onClick={openPasswordDialog}
            type="button"
          >
            Change password
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6" aria-labelledby="session-heading">
        <h2 className="text-xl font-semibold text-neutral-900" id="session-heading">Log out</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-500">
          End your current Focus Room session on this device.
        </p>
        <Button
          className="mt-5 rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          disabled={loggingOut}
          onClick={logout}
          type="button"
          variant="outline"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Logging out…" : "Log out"}
        </Button>
      </section>

      {passwordDialogOpen ? (
        <div
          aria-labelledby="change-password-title"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closePasswordDialog();
          }}
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Account security</p>
                <h2 className="display-serif mt-2 text-3xl text-neutral-900" id="change-password-title">
                  Change password
                </h2>
              </div>
              <button
                aria-label="Close change password"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                onClick={closePasswordDialog}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Choose a new password with at least 8 characters.
            </p>
            <form className="mt-5 grid gap-3" onSubmit={changePassword}>
              <Input
                autoComplete="new-password"
                autoFocus
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
              <div className="mt-2 flex justify-end gap-2">
                <Button disabled={pending} onClick={closePasswordDialog} type="button" variant="outline">
                  Cancel
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Updating…" : "Update password"}
                </Button>
              </div>
              {message ? (
                <p aria-live="polite" className={`text-sm font-medium ${message.includes("successfully") ? "text-green-700" : "text-red-600"}`}>
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
