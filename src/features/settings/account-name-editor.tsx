"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountNameEditor({ initialName }: { initialName: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [currentName, setCurrentName] = useState(initialName);
  const [name, setName] = useState(initialName);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setCurrentName(initialName), [initialName]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, pending]);

  function openEditor() {
    setName(currentName);
    setMessage("");
    setOpen(true);
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (nextName.length < 2) {
      setMessage("Enter at least 2 characters.");
      return;
    }

    setPending(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({
      data: { display_name: nextName }
    });
    setPending(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCurrentName(nextName);
    setMessage("Name updated successfully.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span>{currentName}</span>
      <button
        className="text-sm font-semibold text-blue-600 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-800"
        onClick={openEditor}
        type="button"
      >
        Change name
      </button>

      {open ? (
        <div
          aria-labelledby="change-name-title"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !pending) setOpen(false);
          }}
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Profile</p>
                <h2 className="display-serif mt-2 text-3xl text-neutral-900" id="change-name-title">
                  Change name
                </h2>
              </div>
              <button
                aria-label="Close change name"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                disabled={pending}
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-5 grid gap-3" onSubmit={saveName}>
              <Input
                autoComplete="name"
                autoFocus
                maxLength={60}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
                value={name}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="outline">
                  Cancel
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Saving…" : "Save name"}
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
