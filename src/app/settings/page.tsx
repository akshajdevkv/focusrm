import { Bookmark, Languages, Mail, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { AccountNameEditor } from "@/features/settings/account-name-editor";
import { AccountSecurityActions } from "@/features/settings/account-security-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function accountName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
} | null) {
  const metadataName = user
    ? [
        user.user_metadata?.display_name,
        user.user_metadata?.full_name,
        user.user_metadata?.name
      ].find((value) => typeof value === "string" && value.trim())
    : undefined;

  if (typeof metadataName === "string") return metadataName.trim();
  const emailName = user?.email?.split("@")[0].replace(/[._-]+/g, " ").trim();
  return emailName
    ? emailName.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Focus Room learner";
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const name = accountName(user);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f8] text-[#1c1c1c]">
      <header className="border-b border-neutral-200 bg-[#f7f7f8]">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="logo-mark grid h-11 w-11 place-items-center rounded-md text-3xl leading-none">F</span>
            <span className="brand-title text-2xl sm:text-3xl">Focus Room</span>
          </Link>
          <span className="hidden h-7 w-px bg-neutral-300 sm:block" />
          <span className="hidden text-sm font-medium text-neutral-500 sm:block">Settings</span>
          <div className="ml-auto">
            <UserProfileMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-screen w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:py-14">
        <aside className="flex gap-2 overflow-x-auto pb-2 md:block md:overflow-visible md:pb-0">
          <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 md:block">
            Settings
          </p>
          <a className="flex shrink-0 items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 font-semibold text-blue-700" href="#account-heading">
            <UserRound className="h-5 w-5" />
            Account
          </a>
          <a className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-600 transition hover:bg-white hover:text-neutral-900 md:mt-1" href="#bookmarks">
            <Bookmark className="h-5 w-5" />
            Bookmarks
          </a>
          <a className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-600 transition hover:bg-white hover:text-neutral-900 md:mt-1" href="#language">
            <Languages className="h-5 w-5" />
            Language
          </a>
        </aside>

        <section className="min-w-0 max-w-3xl" aria-labelledby="account-heading">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Account</p>
          <h1 className="display-serif mt-3 text-4xl text-neutral-900 sm:text-5xl" id="account-heading">
            Your account
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
            View the identity connected to your Focus Room learning profile.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="flex items-center gap-4 border-b border-neutral-200 p-5 sm:p-6">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-950 text-xl font-semibold text-white">
                {name.charAt(0).toLocaleUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-neutral-900">{name}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {user ? "Focus Room account" : "You are not currently signed in"}
                </p>
              </div>
            </div>

            <dl>
              <div className="grid gap-2 border-b border-neutral-100 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                <dt className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                  <UserRound className="h-4 w-4" />
                  Display name
                </dt>
                <dd className="font-medium text-neutral-900">
                  {user ? <AccountNameEditor initialName={name} /> : name}
                </dd>
              </div>
              <div className="grid gap-2 border-b border-neutral-100 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                <dt className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                  <Mail className="h-4 w-4" />
                  Email address
                </dt>
                <dd className="break-all font-medium text-neutral-900">
                  {user?.email || "No email connected"}
                </dd>
              </div>
              <div className="grid gap-2 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                <dt className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                  <ShieldCheck className="h-4 w-4" />
                  Authentication
                </dt>
                <dd className="text-sm leading-6 text-neutral-600">
                  {user
                    ? "Your account is secured through Focus Room authentication."
                    : "Sign in to access your saved learning profile across devices."}
                </dd>
              </div>
            </dl>
          </div>

          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6" id="bookmarks">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Bookmarks</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  View the courses and videos you saved for later.
                </p>
              </div>
              <Button asChild className="w-fit rounded-full px-5" variant="outline">
                <Link href="/playlists?bookmarked=1">View bookmarks</Link>
              </Button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6" id="language">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Language</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">Interface language</p>
              </div>
              <span className="rounded-full border border-neutral-200 bg-[#f7f7f8] px-4 py-2 text-sm font-semibold text-neutral-700" aria-label="Language is fixed to English">
                English
              </span>
            </div>
            <p className="mt-4 text-xs text-neutral-400">Language selection cannot be changed yet.</p>
          </section>

          {user ? <AccountSecurityActions /> : null}

          {!user ? (
            <Button asChild className="mt-6 rounded-full px-6">
              <Link href="/auth/login">Sign in to Focus Room</Link>
            </Button>
          ) : null}
        </section>
      </main>
      <SiteFooter showSignIn={!user} />
    </div>
  );
}
