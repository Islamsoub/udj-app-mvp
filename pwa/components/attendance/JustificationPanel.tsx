'use client';

import type { ReactNode } from 'react';
import type { AbsenceRecord } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { AbsenceDate } from './AbsenceDate';
import {
  CheckIcon,
  DocumentIcon,
  ExternalIcon,
  PendingIcon,
  RejectedIcon,
  UploadIcon,
} from './icons';
import { justificationState } from './model';
import styles from './attendance.module.css';

/**
 * The body of the justification panel — everything inside SlidePanel's chrome.
 *
 * §9: "Opening the justification panel routes to one of four sub-states (upload
 * form / pending / approved / rejected) with no transition between them since
 * they're mutually exclusive server states, not something a user toggles."
 *
 * So this is a switch and nothing more. There is no shared shell that animates
 * between branches and no crossfade: the panel's own entrance is the only motion
 * involved, and by the time it plays the branch is already decided.
 *
 * ── NOTHING HERE SUBMITS ─────────────────────────────────────────────────────
 *
 * The upload branch renders the form and disables its submit with the reason
 * stated beside it. There is no file input wired to anything, no drag-and-drop
 * target, and no request — POST /student/attendance/:recordId/justification is
 * untouched by this screen. A control that accepted a file and then dropped it
 * would be worse than one that plainly says it is not ready.
 */
export function JustificationPanel({ record }: { record: AbsenceRecord }) {
  const state = justificationState(record);

  switch (state) {
    case 'pending':
      return <PendingBody record={record} />;
    case 'approved':
      return <ApprovedBody record={record} />;
    case 'rejected':
      return <RejectedBody record={record} />;
    default:
      return <UploadBody record={record} />;
  }
}

// ── The four bodies ───────────────────────────────────────────────────────────

/**
 * No justification on file. The form, inert.
 *
 * The reason lives in a paragraph the button points at with aria-describedby, so
 * a screen reader that lands on a disabled control is told why it is disabled
 * instead of being left with a dead end.
 */
function UploadBody({ record }: { record: AbsenceRecord }) {
  const { t } = useI18n();

  return (
    <Body record={record}>
      <Banner tone="neutral" icon={<UploadIcon className={styles.bannerIcon} />}>
        {t('attendance.panel.none.title')}
      </Banner>

      <p className={styles.panelText}>{t('attendance.panel.none.body')}</p>

      <div className={styles.form}>
        <p className={styles.formLabel}>{t('attendance.panel.none.file_label')}</p>

        {/*
          A DESCRIPTION OF THE DROP ZONE, not a drop zone. §5 specifies a dragover
          state and a progress bar for this element; building either would mean
          building the upload, which this change does not. So it is rendered as
          the inert placeholder it is — no input, no drop handlers, no pointer
          cursor — and the accepted formats are still stated, because they are
          what the student needs to know before walking to the faculty office.
        */}
        <div className={styles.dropZone} aria-hidden="true">
          <DocumentIcon className={styles.dropIcon} />
          <p className={styles.dropText}>{t('attendance.panel.none.file_hint')}</p>
        </div>

        <p className={styles.formLabel}>{t('attendance.panel.none.note_label')}</p>
        <p className={styles.formHint}>{t('attendance.panel.none.note_hint')}</p>

        <p id={DISABLED_REASON_ID} className={styles.disabledReason}>
          {t('attendance.panel.none.disabled_reason')}
        </p>

        <button
          type="button"
          className={styles.submit}
          disabled
          aria-describedby={DISABLED_REASON_ID}
        >
          {t('attendance.panel.none.submit')}
        </button>
      </div>
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

const DISABLED_REASON_ID = 'justification-submit-reason';
