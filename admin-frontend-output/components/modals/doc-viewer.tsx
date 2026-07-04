'use client';

import { useState } from 'react';
import { FileText, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useDecideJustification } from '@/hooks/queries/use-attendance';
import { apiErrorMessage, fmtDate } from '@/lib/utils';
import type { AttendanceRecordRow } from '@/lib/types';

const STRIPES = {
  background: 'repeating-linear-gradient(45deg, var(--surface2) 0 12px, var(--sunken) 12px 24px)',
} as const;

/**
 * DocViewer (impl spec §28, supplement §5.2) — justification document viewer
 * with zoom chrome. Approve/reject wired back to the attendance queue.
 */
export function DocViewer({ record }: { record: AttendanceRecordRow }) {
  const { close } = useModal();
  const { toast } = useToast();
  const decide = useDecideJustification();
  const [scale, setScale] = useState(1);

  const url = record.justificationDocUrl ?? '';
  const isImage = /\.(jpe?g|png|webp)$/i.test(url);
  const isPdf = /\.pdf$/i.test(url);
  const studentName = `${record.student.firstName} ${record.student.lastName}`;
  const filename = `justificatif_${record.id}.${isPdf ? 'pdf' : 'jpg'}`;

  const zoom = (delta: number) =>
    setScale((s) => Math.min(2, Math.max(0.5, Math.round((s + delta) * 100) / 100)));

  const act = async (decision: 'approve' | 'reject') => {
    try {
      await decide.mutateAsync({ id: record.id, decision });
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <Modal
      title={studentName}
      sub={`${record.subject.nameFr} · Absent le ${fmtDate(record.sessionDate)}`}
      icon={<FileText size={19} />}
      iconTone="blue"
      width={560}
      footer={
        record.justificationStatus === 'PENDING' ? (
          <>
            <Button kind="danger" disabled={decide.isPending} onClick={() => act('reject')}>
              Rejeter
            </Button>
            <Button disabled={decide.isPending} onClick={() => act('approve')}>
              Valider
            </Button>
          </>
        ) : (
          <Button kind="quiet" onClick={close}>
            Fermer
          </Button>
        )
      }
    >
      <div className="mb-2 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => zoom(-0.25)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[9px] border-0 bg-transparent text-ink2 transition-colors hover:bg-sunken"
          aria-label="Zoom arrière"
        >
          <ZoomOut size={16} />
        </button>
        <span className="w-[44px] text-center font-mono text-[11px] text-ink3">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoom(0.25)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[9px] border-0 bg-transparent text-ink2 transition-colors hover:bg-sunken"
          aria-label="Zoom avant"
        >
          <ZoomIn size={16} />
        </button>
      </div>
      <div className="h-[340px] overflow-hidden rounded-[12px]" style={STRIPES}>
        <div
          className="flex h-full w-full items-center justify-center transition-transform duration-150"
          style={{ transform: `scale(${scale})` }}
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="max-h-full max-w-full object-contain" />
          ) : isPdf ? (
            <iframe src={url} title={filename} className="h-full w-full border-0 bg-surface" />
          ) : (
            <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[12px] bg-surface text-ink3 shadow">
              {isImage ? <ImageIcon size={24} /> : <FileText size={24} />}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 text-center font-mono text-[11px] text-ink3">{filename}</div>
      {record.justificationReason && (
        <div className="mt-2 text-center text-[13px] text-ink2">{record.justificationReason}</div>
      )}
      {record.justificationNote && (
        <div className="mt-3 rounded-[10px] bg-surface2 p-3 text-[13px] italic text-ink2">
          « {record.justificationNote} »
        </div>
      )}
    </Modal>
  );
}
