'use client';

import type { ReactNode } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type { AbsenceRecord, UploadJustificationResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { AbsenceDate } from './AbsenceDate';
import {
  CheckIcon,
  DocumentIcon,
  ExternalIcon,
  PendingIcon,
  RejectedIcon,
  UnjustifiedIcon,
  UploadIcon,
} from './icons';
import { JustificationForm } from './JustificationForm';
import { justificationState } from './model';
import styles from './attendance.module.css';

/**
 * The body of the justification panel — everything inside SlidePanel's chrome.
 *
 * §9: "Opening the justification panel routes to one of four sub-states (upload
 * form / pending / approved / rejected) with no transition between them since
 * they're mutually exclusive server states, not something a user toggles."
 * The upload-form state splits in two on the server's `canSubmitJustification`:
 * the form while the window is open, an explanation once it has closed.
 *
 * So this is a switch and nothing more. There is no shared shell that animates
 * between branches and no crossfade: the panel's own entrance is the only motion
 * involved, and by the time it plays the branch is already decided.
 *
 * ── THE UPLOAD BRANCH IS THE ONLY ONE THAT WRITES ───────────────────────────
 *
 * It POSTs to /student/attendance/:recordId/justification and, on success,
 * hands the response up through `onUploaded` so the record can be patched in
 * place. The other three are read-only views of a decision already taken.
 */
export function JustificationPanel({
  record,
  deadlineDays,
  onUploaded,
}: {
  record: AbsenceRecord;
  /** The response's `justificationDeadlineDays`, stated by the expired body. */
  deadlineDays: number;
  /** Hands the server response up so the screen behind can patch this record
   *  in place — the list must reflect the new PENDING state without a refetch. */
  onUploaded: (result: UploadJustificationResponse) => void;
}) {
  const state = justificationState(record);

  switch (state) {
    case 'expired':
      return <ExpiredBody record={record} deadlineDays={deadlineDays} />;
    case 'pending':
      return <PendingBody record={record} />;
    case 'approved':
      return <ApprovedBody record={record} />;
    case 'rejected':
      return <RejectedBody record={record} />;
    default:
      return <UploadBody record={record} onUploaded={onUploaded} />;
  }
}

// ── The four bodies ───────────────────────────────────────────────────────────

/**
 * No justification on file — the upload form.
 *
 * The form itself lives in JustificationForm: selection, validation, the request
 * and its failures are a state machine of their own, and keeping it out of here
 * leaves this file as the four-way switch it is meant to be.
 */
function UploadBody({
  record,
  onUploaded,
}: {
  record: AbsenceRecord;
  onUploaded: (result: UploadJustificationResponse) => void;
}) {
  const { t } = useI18n();

  return (
    <Body record={record}>
      <Banner tone="neutral" icon={<UploadIcon className={styles.bannerIcon} />}>
        {t('attendance.panel.none.title')}
      </Banner>

      <p className={styles.panelText}>{t('attendance.panel.none.body')}</p>

      <JustificationForm recordId={record.id} onUploaded={onUploaded} />
    </Body>
  );
}

/**
 * Nothing filed, and the server no longer accepts a submission.
 *
 * Says why instead of showing an inert form: the window, in days, as the
 * server states it, and where to turn instead. The figure goes through
 * Interpolated so it stays on the Latin face in Arabic.
 */
function ExpiredBody({ record, deadlineDays }: { record: AbsenceRecord; deadlineDays: number }) {
  const { t } = useI18n();

  return (
    <Body record={record}>
      <Banner tone="neutral" icon={<UnjustifiedIcon className={styles.bannerIcon} />}>
        {t('attendance.panel.expired.title')}
      </Banner>

      <p className={styles.panelText}>
        <Interpolated template={t('attendance.panel.expired.body')} values={{ days: deadlineDays }} />
      </p>
    </Body>
  );
}

/** Filed, and the faculty has not decided yet. */
function PendingBody({ record }: { record: AbsenceRecord }) {
  const { t } = useI18n();

  return (
    <Body record={record}>
      <Banner tone="pending" icon={<PendingIcon className={styles.bannerIcon} />}>
        {t('attendance.panel.pending.title')}
      </Banner>

      <p className={styles.panelText}>{t('attendance.panel.pending.body')}</p>

      <Note note={record.justificationNote} label={t('attendance.panel.note_sent')} />
      <Attachment url={record.justificationUrl} />
    </Body>
  );
}

/**
 * Accepted — the absence does not count against the percentage.
 *
 * TWO SHAPES REACH THIS BRANCH and the wording has to tell them apart. A record
 * with justificationStatus APPROVED went through a review and has a document. A
 * record that is merely JUSTIFIED with no justificationStatus was excused at
 * source, with nothing ever submitted — saying "your justification was approved"
 * there would describe a review that never happened. The document's presence is
 * what distinguishes them, so it is what picks the sentence.
 */
function ApprovedBody({ record }: { record: AbsenceRecord }) {
  const { t } = useI18n();

  const reviewed = record.justificationStatus === 'APPROVED';

  return (
    <Body record={record}>
      <Banner tone="approved" icon={<CheckIcon className={styles.bannerIcon} />}>
        {t(reviewed ? 'attendance.panel.approved.title' : 'attendance.panel.excused.title')}
      </Banner>

      <p className={styles.panelText}>
        {t(reviewed ? 'attendance.panel.approved.body' : 'attendance.panel.excused.body')}
      </p>

      <Note note={record.justificationNote} label={t('attendance.panel.note_sent')} />
      <Attachment url={record.justificationUrl} />
    </Body>
  );
}

/** Turned down. The absence counts, and the note says why if the faculty left
 *  one — `justificationNote` carries the student's reason on submission and the
 *  reviewer's overwrite on a decision, so on a rejected record it is the
 *  faculty's word. */
function RejectedBody({ record }: { record: AbsenceRecord }) {
  const { t } = useI18n();

  return (
    <Body record={record}>
      <Banner tone="rejected" icon={<RejectedIcon className={styles.bannerIcon} />}>
        {t('attendance.panel.rejected.title')}
      </Banner>

      <p className={styles.panelText}>{t('attendance.panel.rejected.body')}</p>

      <Note note={record.justificationNote} label={t('attendance.panel.note_reason')} />
      <Attachment url={record.justificationUrl} />
    </Body>
  );
}

// ── Shared parts ──────────────────────────────────────────────────────────────

/** The date line every branch opens with, plus the branch's own content. The
 *  panel's title is the subject, so the date is what tells the student which of
 *  that subject's sessions they are looking at. */
function Body({ record, children }: { record: AbsenceRecord; children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className={styles.panelBody}>
      <p className={styles.panelDate}>
        <span className={styles.panelDateLabel}>{t('attendance.panel.session')}</span>
        {/* No outer `.num`: AbsenceDate scopes it to the figures, so the
            Arabic month name stays on the face that can draw it. */}
        <span className={styles.panelDateValue}>
          <AbsenceDate iso={record.date} />
        </span>
      </p>

      {children}
    </div>
  );
}

/** The branch's verdict, as an icon and a sentence on a tinted band — never the
 *  tint alone (§10). */
function Banner({
  tone,
  icon,
  children,
}: {
  tone: 'neutral' | 'pending' | 'approved' | 'rejected';
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <p className={`${styles.banner} ${BANNER_CLASS[tone]}`}>
      {icon}
      <span>{children}</span>
    </p>
  );
}

const BANNER_CLASS = {
  neutral: styles.bannerNeutral,
  pending: styles.bannerPending,
  approved: styles.bannerApproved,
  rejected: styles.bannerRejected,
};

/** Free text from the student or the faculty. Absent on most records, so the
 *  block is omitted rather than rendered empty. */
function Note({ note, label }: { note: string | null; label: string }) {
  if (note === null || note.trim() === '') return null;

  return (
    <div className={styles.note}>
      <p className={styles.noteLabel}>{label}</p>
      <p className={styles.noteText}>{note}</p>
    </div>
  );
}

/**
 * The attached document.
 *
 * `justificationUrl` arrives as a TIME-LIMITED SIGNED SUPABASE STORAGE URL,
 * minted per request by the backend (createSignedUrl, one hour). It points at
 * Supabase, not at this app and not at the backend, so it is used EXACTLY as
 * received: not rewritten, not routed through /api/backend, not cached. Any of
 * those would either break the signature or outlive it.
 *
 * Opened in a new tab so the student does not lose the screen to a PDF, with
 * `rel="noopener noreferrer"` — the target holds a signed credential in its
 * query string, and neither a window handle back to this app nor a Referer
 * carrying that URL should leave with it.
 */
function Attachment({ url }: { url: string | null }) {
  const { t } = useI18n();

  if (url === null) {
    return <p className={styles.noDocument}>{t('attendance.panel.no_document')}</p>;
  }

  return (
    <a className={styles.document} href={url} target="_blank" rel="noopener noreferrer">
      <DocumentIcon className={styles.documentIcon} />
      <span className={styles.documentText}>{t('attendance.panel.open_document')}</span>
      <ExternalIcon className={styles.documentExternal} />
    </a>
  );
}
