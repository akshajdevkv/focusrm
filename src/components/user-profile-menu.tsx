"use client";

import { Bookmark, CircleHelp, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileUser = {
  email?: string;
  user_metadata?: Record<string, unknown>;
} | null;

function profileDetails(user: ProfileUser) {
  const metadataName = user
    ? [
        user.user_metadata?.display_name,
        user.user_metadata?.full_name,
        user.user_metadata?.name
      ].find((value) => typeof value === "string" && value.trim())
    : undefined;
  const emailName = user?.email?.split("@")[0].replace(/[._-]+/g, " ").trim();
  const name = typeof metadataName === "string"
    ? metadataName.trim()
    : emailName
      ? emailName.replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Focus Room";

  return {
    initial: name.charAt(0).toLocaleUpperCase() || "F",
    name
  };
}

export function UserProfileMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState(() => profileDetails(null));

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setProfile(profileDetails(data.user));
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfile(profileDetails(session?.user || null));
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  const menuItemClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-neutral-700 transition hover:bg-blue-50 hover:text-blue-700";

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open user profile menu"
        className={`grid place-items-center rounded-full bg-blue-950 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          compact ? "h-9 w-9" : "h-11 w-11"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {profile.initial}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 text-left shadow-[0_18px_50px_rgba(0,0,0,0.14)]"
          role="menu"
        >
          <div className="border-b border-neutral-100 px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-950 text-sm font-semibold text-white">
                {profile.initial}
              </span>
              <div>
                <p className="max-w-40 truncate font-semibold text-neutral-900">{profile.name}</p>
                <p className="text-xs text-neutral-500">Your learning profile</p>
              </div>
            </div>
          </div>

          <Link className={`${menuItemClass} mt-2`} href="/playlists?bookmarked=1" role="menuitem">
            <Bookmark className="h-5 w-5" />
            My bookmarks
          </Link>
          <Link className={menuItemClass} href="/#focus-tools" role="menuitem">
            <CircleHelp className="h-5 w-5" />
            Help
          </Link>
          <Link className={menuItemClass} href="/settings" role="menuitem">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <div className="mt-1 border-t border-neutral-100 pt-1">
            <button
              className={`${menuItemClass} hover:bg-red-50 hover:text-red-700 disabled:opacity-60`}
              disabled={signingOut}
              onClick={logout}
              role="menuitem"
              type="button"
            >
              <LogOut className="h-5 w-5" />
              {signingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
