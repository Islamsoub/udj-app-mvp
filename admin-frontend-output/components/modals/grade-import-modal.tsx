'use client';

import { useMemo, useRef, useState } from 'react';
import { Download, FileUp, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, Th, Td, TRow } from '@/components/ui/table';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useBulkGrades } from '@/hooks/queries/use-grades';
import { useSettings } from '@/hooks/queries/use-settings';
import { NF, fmt } from '@/lib/grade-helpers';
import { apiErrorMessage, cn, downloadCsv, parseCsv } from '@/lib/utils';

interface RosterLite {
  id: string;
  name: string;
  matricule: string;
}

interface ParsedRow {
  matricule: string;
  cc: number | null;
  cf: number | null;
  student?: RosterLite;
  error?: string;
}

const EXPECTED_HEADER = ['matricule', 'note_cc', 'note_cf'];

function parseNote(raw: string): { value: number | null; invalid: boolean } {
  const t = raw.trim().replace(',', '.');
  if (t === '') return { value: null, invalid: false };
  const n = Number(t);
  if (Number.isNaN(n) || n < 0 || n > 20) return { value: null, invalid: true };
  return { value: n, invalid: false };
}

/**
 * GradeImportModal (impl spec §28, supplement §7.2) — 2-step CSV grade
 * import: template + dropzone, then a verify table with per-row status.
 */
export function GradeImportModal({
  subjectId,
  semesterId,
  students,
}: {
  subjectId: string;
  semesterId: string;
  students: RosterLite[];
}) {
  const { close } = useModal();
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const bulk = useBulkGrades();

  const [step, setStep] = useState<1 | 2>(1);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const wCc = settings?.gradeWeightCc ?? 0.4;
  const wCf = settings?.gradeWeightCf ?? 0.6;

  const handleFile = async (file: File) => {
    setFileError(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    const header = parsed[0]?.map((h) => h.trim().toLowerCase()) ?? [];
    if (EXPECTED_HEADER.some((h, i) => header[i] !== h)) {
      setFileError('Colonnes attendues : matricule, note_cc, note_cf');
      return;
    }
    const next: ParsedRow[] = parsed.slice(1).map((cols) => {
      const matricule = (cols[0] ?? '').trim();
      const cc = parseNote(cols[1] ?? '');
      const cf = parseNote(cols[2] ?? '');
      const student = students.find(
        (s) => s.matricule.toLowerCase() === matricule.toLowerCase()
      );
      let error: string | undefined;
      if (!student) error = 'matricule inconnu';
      else if (cc.invalid || cf.invalid) error = 'note hors barème 0–20';
      return { matricule, cc: cc.value, cf: cf.value, student, error };
    });
    setRows(next);
    setStep(2);
  };

  const validRows = useMemo(() => rows.filter((r) => !r.error), [rows]);
  const errorCount = rows.length - validRows.length;

  const onImport = async () => {
    try {
      const res = await bulk.mutateAsync({
        subjectId,
        semesterId,
        rows: validRows.map((r) => ({
          studentId: r.student!.id,
          noteCc: r.cc,
          noteCf: r.cf,
        })),
      });
      toast(`${res.saved} notes importées`, 'check');
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <Modal
      title="Importer des notes (CSV)"
      sub={step === 1 ? 'Étape 1 · Téléversez le fichier' : 'Étape 2 · Vérifiez les notes'}
      icon={<Upload size={19} />}
      iconTone="jade"
      width={560}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          {step === 2 && (
            <Button disabled={validRows.length === 0 || bulk.isPending} onClick={onImport}>
              Importer les notes
            </Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[13px] text-ink2">
              Format attendu : <span className="font-mono text-[12px] text-ink">matricule, note_cc, note_cf</span>
            </div>
            <Button
              kind="ghost"
              size="sm"
              icon={<Download size={15} />}
              onClick={() => downloadCsv('modele_notes.csv', ['matricule', 'note_cc', 'note_cf'], [])}
            >
              Télécharger le modèle
            </Button>
          </div>
          <div
            className={cn(
              'flex h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed transition-colors',
              dragging ? 'border-jade bg-jade-faint' : 'border-hair2 bg-surface2'
            )}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
          >
            <FileUp size={24} className="text-ink3" />
            <div className="text-[13px] font-semibold text-ink2">
              Glissez le fichier CSV ici, ou cliquez pour parcourir
            </div>
            <div className="font-mono text-[11px] text-ink3">.csv uniquement</div>
          </div>
          {fileError && <div className="mt-2 text-[12.5px] text-danger">{fileError}</div>}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      ) : (
        <div>
          <div className="mb-3 text-[13px] font-semibold text-ink2">
            <span className="text-jade-text">{validRows.length} notes prêtes</span>
            <span className="text-ink3"> · </span>
            <span className={errorCount > 0 ? 'text-danger' : 'text-ink3'}>{errorCount} erreurs</span>
          </div>
          <div className="overflow-hidden rounded-[12px] border border-hair">
            <Table>
              <THead>
                <tr>
                  <Th>Étudiant</Th>
                  <Th>CC</Th>
                  <Th>CF</Th>
                  <Th>NF</Th>
                  <Th>Statut</Th>
                </tr>
              </THead>
              <tbody>
                {rows.map((r, i) => {
                  const nf = r.error ? null : NF(r.cc, r.cf, wCc, wCf);
                  return (
                    <TRow key={`${r.matricule}-${i}`} className={r.error ? 'bg-danger-bg' : undefined}>
                      <Td>
                        {r.student ? (
                          <span className="text-[13px] font-semibold text-ink">{r.student.name}</span>
                        ) : (
                          <span className="font-mono text-[12.5px] text-danger">{r.matricule || '—'}</span>
                        )}
                      </Td>
                      <Td className="font-mono text-[13px]">{fmt(r.cc)}</Td>
                      <Td className="font-mono text-[13px]">{fmt(r.cf)}</Td>
                      <Td className="font-mono text-[13px] font-bold">{fmt(nf)}</Td>
                      <Td>
                        {r.error ? (
                          <Badge tone="danger">{r.error}</Badge>
                        ) : (
                          <Badge tone="jade">Prêt</Badge>
                        )}
                      </Td>
                    </TRow>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </Modal>
  );
}
