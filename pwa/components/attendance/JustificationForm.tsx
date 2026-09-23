'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import { useOnline } from '@/components/shell/useOnline';
import { ApiError, uploadJustification } from '@/lib/api-client';
import type { UploadJustificationResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { CheckIcon, DocumentIcon, UploadIcon } from './icons';
import { ACCEPTED_TYPES, MAX_UPLOAD_MB, validateFile } from './upload';
import { useReducedMotion } from './useReducedMotion';
import styles from './attendance.module.css';

/**
 * The upload form: file selection, client-side validation, the request, and
 * every way it can fail.
 *
 * §5's file drop zone: "dragover state adds a jade dashed border + jade-faint
 * background over --dur-instant; drop triggers the upload-progress bar animating
 * 0->100% in discrete steps (matches the current prototype's simulated
 * 20%-per-tick fill), then crossfades to a doc-chip confirmation."
 *
 * ── THE PROGRESS BAR IS SIMULATED, AND THAT IS THE SPEC ──────────────────────
 *
 * `fetch` exposes no upload-progress event; only XMLHttpRequest does. Switching
 * to XHR would mean leaving `apiFetch` behind, and with it the single-flight
 * 401 refresh, the retry-once rule and the session-expired notification — a
 * student whose access token expired mid-upload would simply be logged out
 * instead of refreshed. That is a bad trade for a smoother bar, and §5 asks for
 * the discrete simulated fill anyway.
 *
 * So the bar steps 20% per tick and HOLDS AT 80% until the response lands,
 * rather than creeping to 99% and lying. The last step to 100% is the real
 * completion.
 */
export function JustificationForm({
  recordId,
  onUploaded,
}: {
  recordId: string;
  /** Called once, with the server's response, so the screen behind can patch
   *  the record without refetching. */
  onUploaded: (result: UploadJustificationResponse) => void;
}) {
  const { t } = useI18n();
  const { online } = useOnline();
  const reducedMotion = useReducedMotion();

  const inputId = useId();
  const errorId = useId();
  const hintId = useId();


  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  /*
   * The result is held here rather than handed straight up, so the confirmation
   * chip §5 asks for is actually seen: patching the record upstream re-routes
   * the panel to its PENDING body and unmounts this form immediately.
   */
  const [result, setResult] = useState<UploadJustificationResponse | null>(null);
  const delivered = useRef(false);
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  /** Fires `onUploaded` exactly once, whoever gets there first. */
  const deliver = (payload: UploadJustificationResponse) => {
    if (delivered.current) return;
    delivered.current = true;
    onUploadedRef.current(payload);
  };

  /*
   * Hand the result upstream after the confirmation has been on screen for
   * §5's success-flash window, OR immediately if the student closes the panel
   * first. Without the unmount path, closing during that second would leave the
   * list showing "À justifier" for a record the server has already accepted.
   */
  useEffect(() => {
    if (result === null) return;

    const timer = window.setTimeout(() => deliver(result), SUCCESS_FLASH_MS);
    return () => {
      window.clearTimeout(timer);
      deliver(result);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;

    const problem = validateFile(candidate);
    if (problem !== null) {
      // The rejected file is NOT kept. Leaving it selected would put a file the
      // student cannot send next to an enabled-looking button.
      setFile(null);
      setError(problem);
      return;
    }

    setFile(candidate);
    setError(null);
  };

  // ── Drag and drop (§5) ────────────────────────────────────────────────────

  /*
   * dragenter/dragover fire continuously and on every descendant, so a naive
   * boolean flickers as the pointer crosses the icon inside the zone. A depth
   * counter is the standard fix: enter increments, leave decrements, and the
   * state is on only while the count is above zero.
   */
  const dragDepth = useRef(0);

  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    if (phase !== 'idle') return;
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDragOver = (event: React.DragEvent) => {
    // Without this the browser navigates to the dropped file and the app is gone.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (phase !== 'idle') return;

    // One file only — the backend's multer is configured `files: 1`, and
    // silently uploading the first of several would not match what was dropped.
    const dropped = event.dataTransfer.files;
    if (dropped.length > 1) {
      setFile(null);
      setError('attendance.upload.error.multiple');
      return;
    }
    accept(dropped[0]);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (file === null || phase !== 'idle' || !online) return;

    setPhase('uploading');
    setError(null);
    setProgress(0);

    /*
     * §5's discrete 20%-per-tick fill, capped at 80 until the server answers.
     * Cleared in every exit path below — a timer left running past a failure
     * would keep filling a bar under an error message.
     */
    const ticker = window.setInterval(() => {
      setProgress((current) => (current >= PROGRESS_CEILING ? current : current + PROGRESS_STEP));
    }, PROGRESS_TICK_MS);

    try {
      const response = await uploadJustification(recordId, file, note);
      window.clearInterval(ticker);
      setProgress(100);
      setPhase('done');
      setResult(response);
    } catch (err) {
      window.clearInterval(ticker);
      setProgress(0);
      setPhase('idle');
      setError(errorKey(err));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'done' && result !== null) {
    return (
      <div className={styles.form}>
        {/*
          §5: the bar "crossfades to a doc-chip confirmation". The bar is gone
          and the chip is in its place, entering on the same --dur-fast fade the
          rest of the screen uses. The panel flips to its PENDING body a moment
          later, where this same document is reachable as a link.
        */}
        <p
          className={`${styles.confirmChip} ${reducedMotion ? '' : styles.confirmChipEntering}`}
          role="status"
          aria-live="polite"
        >
          <CheckIcon className={styles.confirmIcon} />
          <span>{t('attendance.upload.sent')}</span>
        </p>
      </div>
    );
  }

  const uploading = phase === 'uploading';
  const disabled = file === null || uploading || !online;

  return (
    <div className={styles.form}>
      <p className={styles.formLabel} id={`${inputId}-label`}>
        {t('attendance.panel.none.file_label')}
      </p>

      {/*
        A <label> wrapping a visually-hidden <input type="file">. The input is
        hidden rather than absent so the keyboard and assistive tech reach the
        real control — a div with a click handler would give neither. Clicking
        anywhere on the zone opens the picker because that is what a label does.
      */}
      <label
        className={[
          styles.dropZone,
          styles.dropZoneLive,
          dragging ? styles.dropZoneDragging : '',
          uploading ? styles.dropZoneBusy : '',
        ]
          .filter(Boolean)
          .join(' ')}
        htmlFor={inputId}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          id={inputId}
          className={styles.fileInput}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          disabled={uploading}
          aria-describedby={`${hintId}${error === null ? '' : ` ${errorId}`}`}
          onChange={(event) => {
            accept(event.target.files?.[0]);
            /*
             * The input is cleared so choosing the SAME file twice still fires
             * `change`. Without it, a student who picked a 6 MB file, saw the
             * size error, and picked it again by mistake would get no feedback
             * at all — the browser suppresses a change event for an identical
             * value.
             */
            event.target.value = '';
          }}
        />

        {file === null ? (
          <>
            <UploadIcon className={styles.dropIcon} />
            <p className={styles.dropText}>{t('attendance.upload.drop_hint')}</p>
          </>
        ) : (
          <>
            <DocumentIcon className={styles.dropIcon} />
            {/* The name is the student's own filename and may be Arabic, so it
                is NOT forced onto the Latin face; the size is a figure and is. */}
            <p className={styles.dropFileName}>{file.name}</p>
            <p className={`${styles.dropFileSize} num`}>{formatSize(file.size)}</p>
          </>
        )}
      </label>

      <p className={styles.formHint} id={hintId}>
        {/*
          The real limit, in the copy. 4.5 and not the backend's 5 — see
          components/attendance/upload.ts for why, and do not "correct" it.
        */}
        <Interpolated
          template={t('attendance.upload.formats')}
          values={{ size: MAX_UPLOAD_MB }}
        />
      </p>

      {error !== null && (
        <p className={styles.formError} id={errorId} role="alert">
          <Interpolated template={t(error)} values={{ size: MAX_UPLOAD_MB }} />
        </p>
      )}

      <p className={styles.formLabel}>{t('attendance.panel.none.note_label')}</p>
      <input
        className={styles.noteInput}
        type="text"
        value={note}
        maxLength={NOTE_MAX}
        disabled={uploading}
        placeholder={t('attendance.upload.note_placeholder')}
        onChange={(event) => setNote(event.target.value)}
      />
      <p className={styles.formHint}>{t('attendance.panel.none.note_hint')}</p>

      {uploading && (
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('attendance.upload.progress_label')}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        >
          <span className={styles.progressFill} />
        </div>
      )}

      <button
        type="button"
        className={styles.submit}
        disabled={disabled}
        onClick={submit}
      >
        {t(
          uploading
            ? 'attendance.upload.sending'
            : online
              ? 'attendance.panel.none.submit'
              : 'login.submit_offline'
        )}
      </button>

      {!online && (
        <p className={styles.formHint} role="status">
          {/*
            An upload cannot be queued: this app has no service worker and no
            local store, so a "send later" promise would be a promise nothing
            keeps. Saying the connection is required is the honest version.
          */}
          {t('attendance.upload.offline')}
        </p>
      )}
    </div>
  );
}

// ── Failure mapping ───────────────────────────────────────────────────────────

/**
 * Turns a thrown request error into a translation key. The raw message is NEVER
 * rendered — it is only read here to pick between keys.
 *
 * ── THE BACKEND SENDS NO ERROR CODE ──────────────────────────────────────────
 *
 * Its error handler emits `{ error: <human sentence> }` and nothing else (see
 * backend/src/middleware/errorHandler.ts), so two distinct 400s — a rejected
 * file type and an oversized file — and two distinct 409s — a record that is not
 * an absence and one past its submission deadline — are indistinguishable by
 * status alone. Matching on the sentence is the only option available, and it
 * is done defensively: an unrecognised message falls through to the generic
 * message for that status rather than to a wrong specific one. A machine-
 * readable `code` on the backend's error body would remove this entirely.
 */
function errorKey(err: unknown): TranslationKey {
  if (!(err instanceof ApiError)) {
    // Never reached the server: DNS, a dropped connection, a blocked request.
    return 'attendance.upload.error.network';
  }

  const message = messageOf(err.body);

  switch (err.status) {
    case 400:
      if (/type/i.test(message)) return 'attendance.upload.error.type';
      if (/large|size|5\s*mb/i.test(message)) return 'attendance.upload.error.too_large';
      return 'attendance.upload.error.rejected';

    case 404:
      return 'attendance.upload.error.not_found';

    case 409:
      /*
       * The deadline case, and it is the one this data will hit: the backend
       * refuses a justification more than `justificationDeadlineDays` (8) after
       * the session, and that field is not in the attendance response, so the
       * form cannot grey itself out in advance.
       */
      if (/d[ée]lai|deadline|d[ée]pass/i.test(message)) {
        return 'attendance.upload.error.deadline';
      }
      return 'attendance.upload.error.not_absent';

    case 413:
      // Vercel's platform limit, answered before the function runs. Reachable
      // even under the client's 4.5 MB cap if the multipart envelope tips it.
      return 'attendance.upload.error.too_large';

    case 429:
      return 'attendance.upload.error.rate_limited';

    case 500:
      // The handler's only 500 is a failed Storage write.
      return 'attendance.upload.error.storage';

    case 502:
    case 504:
      return 'attendance.upload.error.unavailable';

    default:
      return 'attendance.upload.error.rejected';
  }
}

/** The `error` string out of a parsed body, or '' for anything else. */
function messageOf(body: unknown): string {
  if (typeof body !== 'object' || body === null) return '';
  const value = (body as { error?: unknown }).error;
  return typeof value === 'string' ? value : '';
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** §5's success flash is 1200ms; the confirmation chip borrows the same window
 *  before the panel moves on to its PENDING body. */
const SUCCESS_FLASH_MS = 1200;

/** §5: "simulated 20%-per-tick fill". */
const PROGRESS_STEP = 20;
const PROGRESS_TICK_MS = 180;

/** The bar stops here until the response arrives. Filling to 100 before the
 *  server has answered would claim a success that has not happened. */
const PROGRESS_CEILING = 80;

/** The backend trims and rejects anything longer (400). Enforced in the field
 *  too, so the limit is felt while typing rather than after sending. */
const NOTE_MAX = 80;

/** KB below a megabyte, MB above, one decimal. Latin digits via `.num` at the
 *  call site. */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
