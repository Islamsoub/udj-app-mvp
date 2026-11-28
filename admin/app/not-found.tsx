import Link from 'next/link';

/**
 * Any address the portal has no page for. Without this file Next served its
 * own black page in English ("404 | This page could not be found.") with no
 * way back. "/" goes to the dashboard when signed in and on to /login when not,
 * so one link serves both.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[380px] rounded-[16px] border border-hair bg-surface px-7 py-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/unipocket-icon.svg" alt="" width={44} height={44} className="mx-auto mb-4 block" />
        <p className="m-0 font-mono text-[12px] tracking-[0.12em] text-ink3" aria-hidden="true">
          404
        </p>
        <h1 className="mb-2 mt-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-ink">Page introuvable</h1>
        <p className="mb-6 text-[13.5px] leading-relaxed text-ink2">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[42px] items-center justify-center rounded-[10px] bg-jade6 px-5 text-[13.5px] font-semibold text-white no-underline transition-colors hover:bg-jade7"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
