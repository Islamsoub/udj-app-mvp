'use client';

import { useMemo, useRef, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Download, FileText, Upload } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/select';
import { Table, THead, Th, Td } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useImportStudents } from '@/hooks/queries/use-students';
import { MATRICULE_REGEX, EMAIL_REGEX } from '@/lib/validations';
import { apiErrorMessage, cn, downloadCsv, parseCsv } from '@/lib/utils';
import type { ImportResult, StudentImportRow } from '@/lib/types';

/**
 * Import wizard (impl spec §14, supplement §7.1) — 4 steps:
 * Télécharger · Associer les colonnes · Vérifier · Importer.
 */
const STEPS = ['Télécharger', 'Associer les colonnes', 'Vérifier', 'Importer'] as const;

const TEMPLATE_HEADER = [
  'matricule',
  'prenom',
  'nom',
  'email',
  'programme_code',
  'semestre',
  'mot_de_passe',
];

const REQUIRED_FIELDS = [
  { key: 'matricule', label: 'matricule' },
  { key: 'prenom', label: 'prenom' },
  { key: 'nom', label: 'nom' },
  { key: 'email', label: 'email' },
  { key: 'programme_code', label: 'programme_code' },
] as const;

type FieldKey = (typeof REQUIRED_FIELDS)[number]['key'];

interface LoadedFile {
  name: string;
  sizeKo: number;
  header: string[];
  rows: string[][];
}

interface ParsedRow {
  data: StudentImportRow;
  error: string | null;
}

function Stepper({ step }: { step: number }) {
  return (
    <Card pad={16} className="mb-5">
      <div className="flex items-center gap-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <div key={label} className={cn('flex items-center gap-3', i > 0 && 'flex-1')}>
              {i > 0 && (
                <div className={cn('h-[2px] flex-1 rounded-full', done || current ? 'bg-jade' : 'bg-sunken')} />
              )}
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold',
                    done && 'bg-jade text-white',
                    current && 'border border-jade bg-jade-faint text-jade-text',
                    !done && !current && 'bg-surface2 text-ink3'
                  )}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[12.5px] font-semibold',
                    current ? 'text-ink' : done ? 'text-jade-text' : 'text-ink3'
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function StudentsImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const importStudents = useImportStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({});
  const [autoMatched, setAutoMatched] = useState<Set<FieldKey>>(new Set());
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const loadFile = async (f: File) => {
    const text = await f.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      toast('Fichier vide ou sans lignes de données', 'x');
      return;
    }
    const header = rows[0].map((h) => h.trim());
    const initial: Partial<Record<FieldKey, string>> = {};
    const auto = new Set<FieldKey>();
    for (const field of REQUIRED_FIELDS) {
      const hit = header.find((h) => h.toLowerCase() === field.key);
      if (hit) {
        initial[field.key] = hit;
        auto.add(field.key);
      }
    }
    setMapping(initial);
    setAutoMatched(auto);
    setFile({
      name: f.name,
      sizeKo: Math.max(1, Math.round(f.size / 1024)),
      header,
      rows: rows.slice(1),
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void loadFile(f);
  };

  const colIndex = (field: FieldKey): number =>
    file && mapping[field] ? file.header.indexOf(mapping[field] as string) : -1;

  const parsedRows = useMemo<ParsedRow[]>(() => {
    if (!file) return [];
    const semIdx = file.header.findIndex((h) => h.toLowerCase() === 'semestre');
    const pwIdx = file.header.findIndex((h) => h.toLowerCase() === 'mot_de_passe');
    const seen = new Set<string>();
    return file.rows.map((raw) => {
      const cell = (field: FieldKey) => {
        const idx = colIndex(field);
        return idx >= 0 ? (raw[idx] ?? '').trim() : '';
      };
      const data: StudentImportRow = {
        matricule: cell('matricule'),
        prenom: cell('prenom'),
        nom: cell('nom'),
        email: cell('email'),
        programme_code: cell('programme_code'),
        semestre: semIdx >= 0 ? (raw[semIdx] ?? '1').trim() : '1',
        mot_de_passe: pwIdx >= 0 ? (raw[pwIdx] ?? '').trim() || undefined : undefined,
      };
      let error: string | null = null;
      if (!data.prenom) error = 'Prénom manquant';
      else if (!data.nom) error = 'Nom manquant';
      else if (!MATRICULE_REGEX.test(data.matricule)) error = 'Matricule invalide (UDJ-YYYY-NNNN)';
      else if (!EMAIL_REGEX.test(data.email)) error = 'E-mail invalide';
      else if (seen.has(data.matricule)) error = 'Matricule dupliqué dans le fichier';
      if (!error) seen.add(data.matricule);
      return { data, error };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, mapping]);

  const validRows = parsedRows.filter((r) => !r.error);
  const errorCount = parsedRows.length - validRows.length;
  const allMapped = REQUIRED_FIELDS.every((f) => !!mapping[f.key]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await importStudents.mutateAsync(validRows.map((r) => r.data));
      setResult(res);
      toast(`${res.created} étudiants importés`, 'check');
      setStep(3);
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    } finally {
      setImporting(false);
    }
  };

  const canContinue = step === 0 ? !!file : step === 1 ? allMapped : validRows.length > 0;

  return (
    <>
      <PageHead back="/students" title="Importer des étudiants" />
      <Stepper step={step} />

      <Card>
        {/* ── Step 0: upload ── */}
        {step === 0 && (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-hair2 transition-colors hover:border-jade hover:bg-jade-faint"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-jade-faint2 text-jade-text">
                <Upload size={20} />
              </span>
              <div className="text-[14px] font-semibold text-ink">
                Glissez votre fichier CSV ici ou cliquez pour parcourir
              </div>
              <div className="font-mono text-[11.5px] text-ink3">CSV · max 5 Mo</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void loadFile(f);
                e.target.value = '';
              }}
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-[12.5px] text-ink3">
                Colonnes attendues : <span className="font-mono text-[11.5px]">{TEMPLATE_HEADER.join(', ')}</span>
              </div>
              <Button
                kind="ghost"
                size="sm"
                icon={<Download size={15} />}
                onClick={() => downloadCsv('modele_etudiants.csv', TEMPLATE_HEADER, [])}
              >
                Télécharger le modèle CSV
              </Button>
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-hair bg-surface2 p-3">
                <FileText size={18} className="shrink-0 text-jade-text" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{file.name}</div>
                  <div className="text-[12px] text-ink3">
                    {file.rows.length} lignes · {file.sizeKo} Ko
                  </div>
                </div>
                <Badge tone="jade">Chargé</Badge>
              </div>
            )}
          </>
        )}

        {/* ── Step 1: column mapping ── */}
        {step === 1 && file && (
          <div className="flex flex-col">
            <div className="mb-3 text-[13px] text-ink2">
              Associez chaque champ requis à une colonne de votre fichier.
            </div>
            {REQUIRED_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3 border-t border-hair py-3 first:border-t-0">
                <span className="w-[160px] shrink-0 rounded-[8px] bg-surface2 px-3 py-[6px] font-mono text-[12px] text-ink">
                  {field.label}
                </span>
                <ChevronRight size={15} className="shrink-0 text-ink3" />
                <div className="w-[260px]">
                  <Dropdown
                    value={mapping[field.key] ?? null}
                    onChange={(v) => {
                      setMapping((m) => ({ ...m, [field.key]: v }));
                      setAutoMatched((s) => {
                        const next = new Set(s);
                        if (v.toLowerCase() === field.key) next.add(field.key);
                        else next.delete(field.key);
                        return next;
                      });
                    }}
                    options={file.header.map((h) => ({ value: h, label: h }))}
                    placeholder="Choisir une colonne…"
                    mono
                  />
                </div>
                {autoMatched.has(field.key) && mapping[field.key] && <Badge tone="jade">auto</Badge>}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 2: verify ── */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[12px] bg-jade-faint p-4 text-center">
                <div className="text-[22px] font-extrabold text-jade-text">{validRows.length}</div>
                <div className="text-[12px] font-semibold text-jade-text">Prêts</div>
              </div>
              <div className="rounded-[12px] bg-danger-bg p-4 text-center">
                <div className="text-[22px] font-extrabold text-danger">{errorCount}</div>
                <div className="text-[12px] font-semibold text-danger">À corriger</div>
              </div>
              <div className="rounded-[12px] bg-surface2 p-4 text-center">
                <div className="text-[22px] font-extrabold text-ink">{parsedRows.length}</div>
                <div className="text-[12px] font-semibold text-ink2">Total</div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[12px] border border-hair">
              <Table>
                <THead>
                  <tr>
                    <Th>Matricule</Th>
                    <Th>Prénom</Th>
                    <Th>Nom</Th>
                    <Th>E-mail</Th>
                    <Th>Programme</Th>
                  </tr>
                </THead>
                <tbody>
                  {parsedRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className={cn(row.error && 'bg-danger-bg')}>
                      <Td className="font-mono text-[12px]">
                        {row.data.matricule || '—'}
                        {row.error && (
                          <div className="mt-[2px] text-[11.5px] font-medium text-danger">
                            {row.error}
                          </div>
                        )}
                      </Td>
                      <Td>{row.data.prenom || '—'}</Td>
                      <Td>{row.data.nom || '—'}</Td>
                      <Td className="text-ink2">{row.data.email || '—'}</Td>
                      <Td className="font-mono text-[12px]">{row.data.programme_code || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {parsedRows.length > 20 && (
              <div className="mt-2 text-[12px] text-ink3">
                Aperçu des 20 premières lignes sur {parsedRows.length}.
              </div>
            )}
            <div className="mt-3 text-[12.5px] text-ink3">Les lignes en erreur seront ignorées.</div>
          </>
        )}

        {/* ── Step 3: result ── */}
        {step === 3 && result && (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-jade text-white">
              <Check size={22} strokeWidth={3} />
            </span>
            <div className="mt-4 text-[19px] font-extrabold text-ink">
              {result.created} étudiants importés
            </div>
            <div className="mt-1 text-[13px] text-ink2">{result.skipped} lignes ignorées</div>
            {result.report.filter((r) => r.status === 'error').length > 0 && (
              <div className="mt-4 w-full max-w-[480px] rounded-[12px] bg-surface2 p-4 text-left">
                {result.report
                  .filter((r) => r.status === 'error')
                  .map((r) => (
                    <div key={`${r.row}-${r.matricule}`} className="py-[3px] text-[12px] text-danger">
                      Ligne {r.row} · <span className="font-mono">{r.matricule}</span> — {r.error}
                    </div>
                  ))}
              </div>
            )}
            <Button kind="primary" className="mt-6" onClick={() => router.push('/students')}>
              Voir la liste des étudiants →
            </Button>
          </div>
        )}

        {/* ── Footer nav ── */}
        {step < 3 && (
          <div className="mt-5 flex items-center justify-between border-t border-hair pt-4">
            <Button
              kind="quiet"
              onClick={() => (step === 0 ? router.push('/students') : setStep(step - 1))}
            >
              {step === 0 ? 'Annuler' : 'Précédent'}
            </Button>
            {step < 2 ? (
              <Button kind="primary" disabled={!canContinue} onClick={() => setStep(step + 1)}>
                Continuer
              </Button>
            ) : (
              <Button
                kind="primary"
                disabled={validRows.length === 0 || importing}
                onClick={handleImport}
              >
                {importing ? 'Import en cours…' : `Importer ${validRows.length} étudiants`}
              </Button>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
