'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Megaphone, Search, Users } from 'lucide-react';
import { useStudents } from '@/hooks/queries/use-students';
import { useSubjects } from '@/hooks/queries/use-academics';
import { useNews } from '@/hooks/queries/use-news';
import { SectionLabel } from '@/components/shared/section-label';
import { TextInput } from '@/components/ui/input';

/**
 * GlobalSearch (impl spec §7 + supplement §1.1): 280px input (surface2,
 * radius 10, search icon). Debounced 300ms; live dropdown grouped Étudiants /
 * Matières / Actualités, max 3 each; empty → "Aucun résultat pour « q »".
 * Result click navigates. Closes on outside click.
 */
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const active = debounced.length >= 2;
  const { data: studentsPage } = useStudents(active ? { search: debounced, pageSize: 3 } : { pageSize: 1 });
  const { data: subjects } = useSubjects();
  const { data: news } = useNews();

  const q = debounced.toLowerCase();
  const studentHits = active ? (studentsPage?.data ?? []).slice(0, 3) : [];
  const subjectHits = useMemo(
    () =>
      active
        ? (subjects ?? [])
            .filter((s) => s.nameFr.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
            .slice(0, 3)
        : [],
    [active, subjects, q]
  );
  const newsHits = useMemo(
    () => (active ? (news ?? []).filter((n) => n.titleFr.toLowerCase().includes(q)).slice(0, 3) : []),
    [active, news, q]
  );

  const nothing = active && studentHits.length === 0 && subjectHits.length === 0 && newsHits.length === 0;

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    router.push(path);
  };

  return (
    <div ref={rootRef} className="relative w-[280px]">
      <TextInput
        icon={<Search size={15} />}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher un étudiant, une matière…"
        className="bg-surface2"
      />
      {open && active && (
        <div className="absolute left-0 right-0 z-50 mt-[6px] max-h-[380px] overflow-y-auto rounded-[13px] border border-hair bg-surface py-2 shadow-lg">
          {nothing && (
            <div className="px-4 py-3 text-[13px] text-ink3">
              Aucun résultat pour «&nbsp;{debounced}&nbsp;»
            </div>
          )}
          {studentHits.length > 0 && (
            <div className="px-2 pb-1">
              <SectionLabel className="px-2 py-1">Étudiants</SectionLabel>
              {studentHits.map((s) => (
                <ResultRow
                  key={s.id}
                  icon={<Users size={15} />}
                  primary={s.name}
                  secondary={s.matricule}
                  onClick={() => go(`/students/${s.id}`)}
                />
              ))}
            </div>
          )}
          {subjectHits.length > 0 && (
            <div className="px-2 pb-1">
              <SectionLabel className="px-2 py-1">Matières</SectionLabel>
              {subjectHits.map((s) => (
                <ResultRow
                  key={s.id}
                  icon={<GraduationCap size={15} />}
                  primary={s.nameFr}
                  secondary={s.code}
                  onClick={() => go(`/grades/${s.id}`)}
                />
              ))}
            </div>
          )}
          {newsHits.length > 0 && (
            <div className="px-2">
              <SectionLabel className="px-2 py-1">Actualités</SectionLabel>
              {newsHits.map((n) => (
                <ResultRow
                  key={n.id}
                  icon={<Megaphone size={15} />}
                  primary={n.titleFr}
                  secondary={n.category}
                  onClick={() => go('/news')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  icon,
  primary,
  secondary,
  onClick,
}: {
  icon: React.ReactNode;
  primary: string;
  secondary: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-[10px] rounded-[9px] border-0 bg-transparent px-2 py-[7px] text-left transition-colors hover:bg-surface2"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-jade-faint text-jade-text">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{primary}</span>
        <span className="block truncate font-mono text-[11px] text-ink3">{secondary}</span>
      </span>
    </button>
  );
}
