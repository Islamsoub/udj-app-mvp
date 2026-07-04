'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * PageHead (impl spec §7): optional 34×34 back tile (arrow-l, bordered
 * surface) + title 25/800 −0.02em + optional subtitle (14 ink2) +
 * right-aligned actions cluster (gap 10). Used on every page.
 */
export interface PageHeadProps {
  title: ReactNode;
  sub?: ReactNode;
  back?: string;
  actions?: ReactNode;
}

export function PageHead({ title, sub, back, actions }: PageHeadProps) {
  const router = useRouter();
  return (
    <div className="mb-6 flex items-start gap-3">
      {back && (
        <button
          type="button"
          onClick={() => router.push(back)}
          className="mt-[3px] flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-hair2 bg-surface text-ink2 transition-colors hover:bg-sunken"
          aria-label="Retour"
        >
          <ArrowLeft size={16} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="m-0 text-[25px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {sub && <div className="mt-[4px] text-[14px] text-ink2">{sub}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-[10px]">{actions}</div>}
    </div>
  );
}
