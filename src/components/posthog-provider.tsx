"use client";

import type { User } from "@supabase/supabase-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { ReactNode, Suspense, useEffect, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (typeof window !== "undefined" && posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only"
  });
}

function identifyUser(user: User) {
  const name = [
    user.user_metadata.display_name,
    user.user_metadata.full_name,
    user.user_metadata.name
  ].find((value) => typeof value === "string" && value.trim());

  posthog.identify(
    user.id,
    {
      email: user.email,
      name: typeof name === "string" ? name.trim() : undefined,
      auth_provider: user.app_metadata.provider
    },
    { created_at: user.created_at }
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogKey) return;

    const query = searchParams.toString();
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

function PostHogAuthSync() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!posthogKey) return;

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) identifyUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) identifyUser(session.user);
      if (event === "SIGNED_OUT") posthog.reset();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!posthogKey) return children;

  return (
    <PostHogReactProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogAuthSync />
      {children}
    </PostHogReactProvider>
  );
}
