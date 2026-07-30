import Link from "next/link";

export function SiteFooter({ showSignIn = false }: { showSignIn?: boolean }) {
  return (
    <footer className="gloss-dark relative z-10 border-t border-white/10 px-4 py-10 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-md">
          <Link className="inline-flex items-center gap-3" href="/">
            <span aria-hidden="true" className="logo-mark grid h-11 w-11 place-items-center rounded-md text-3xl leading-none">
              F
            </span>
            <span className="brand-wordmark text-3xl tracking-tight">Focus Room</span>
          </Link>
          <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
            Structured, distraction-free courses built from the best educational videos on YouTube.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-sm font-semibold text-white/52 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 Focus Room. All rights reserved.</p>
        <div className="flex gap-4">
          {showSignIn ? (
            <Link className="transition hover:text-white" href="/auth/login">
              Sign in
            </Link>
          ) : null}
          <Link className="transition hover:text-white" href="/settings">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
