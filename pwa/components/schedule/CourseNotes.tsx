'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ApiError, createCourseNote, deleteCourseNote, getCourseNotes } from '@/lib/api-client';
import { COURSE_NOTE_MAX, type CourseNote } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { useOnline } from '@/components/shell/useOnline';
import { NotificationTime } from '@/components/notifications/NotificationParts';
import styles from './schedule.module.css';

/**
 * "Notes personnelles" in the course detail panel: the student's own notes on
 * one class, stored on the server (/student/course-notes) so the app and the
 * PWA share them.
 *
 * THE CLASS KEY is the mobile app's: subject code + weekday. The same subject on
 * Sunday and on Tuesday holds two separate lists, in both apps.
 *
 * NOTHING IS KEPT ON THE DEVICE. Not in the offline store (getCourseNotes is
 * off its allow-list), not in localStorage: a lab machine's browser is shared by
 * every student who signs in on it. Offline, the form is hidden and the section
 * says the notes need a connection.
 *
 * PRIVACY. The text is only ever rendered. It is never put in an error message,
 * a log line or an aria-live announcement (the save confirmation says "saved",
 * not what was saved).
 *
 * THE SERVER DECIDES. A saved note is shown from the server's answer, not from
 * the draft; a deleted note leaves the list only once the server has answered.
 */

/** The counter appears once the note is within this many characters of the limit. */
const COUNTER_FROM = COURSE_NOTE_MAX - 200;

/** As long as the shell's toast (§5). */
const CONFIRM_MS = 2200;

/** Characters as the backend counts them: code points, so an emoji is one. */
function charCount(text: string): number {
  return [...text].length;
}

type ListState =
  | { kind: 'loading' }
  | { kind: 'ready'; notes: CourseNote[] }
  | { kind: 'error' }
  /** 404: the subject is not in this student's current timetable. */
  | { kind: 'unavailable' };

type SaveError = 'save_error' | 'rate_limited';

export function CourseNotes({ subjectCode, dayOfWeek }: { subjectCode: string; dayOfWeek: number }) {
  const { t } = useI18n();
  const { online } = useOnline();

  const [list, setList] = useState<ListState>({ kind: 'loading' });
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const [saved, setSaved] = useState(false);

  const headingId = useId();
  const fieldId = useId();
  const counterId = useId();
  const saveErrorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Each load gets a number; an answer that arrives after a newer load started
  // (a retry, a reconnect) is dropped instead of overwriting the newer one.
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setList({ kind: 'loading' });
    try {
      const { notes } = await getCourseNotes(subjectCode, dayOfWeek);
      if (seq === loadSeq.current) setList({ kind: 'ready', notes });
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setList({ kind: err instanceof ApiError && err.status === 404 ? 'unavailable' : 'error' });
    }
  }, [subjectCode, dayOfWeek]);

  // Loads on open, and again when the connection comes back — offline there is
  // nothing to load, because nothing is stored.
  useEffect(() => {
    if (online) void load();
  }, [online, load]);

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), CONFIRM_MS);
    return () => window.clearTimeout(id);
  }, [saved]);

  const trimmed = draft.trim();
  const count = charCount(trimmed);
  const tooLong = count > COURSE_NOTE_MAX;
  const canSave = online && count > 0 && !tooLong && !saving && list.kind === 'ready';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const note = await createCourseNote({ subjectCode, dayOfWeek, body: trimmed });
      setList((current) =>
        current.kind === 'ready' ? { kind: 'ready', notes: [note, ...current.notes] } : current
      );
      setDraft('');
      setSaved(true);
    } catch (err) {
      // The draft is kept in every failure case: nothing the student typed is
      // thrown away by a refused or lost request.
      if (err instanceof ApiError && err.status === 404) setList({ kind: 'unavailable' });
      else setSaveError(err instanceof ApiError && err.status === 429 ? 'rate_limited' : 'save_error');
    } finally {
      setSaving(false);
    }
  };

  const onDeleted = (id: string) => {
    setList((current) =>
      current.kind === 'ready'
        ? { kind: 'ready', notes: current.notes.filter((n) => n.id !== id) }
        : current
    );
    // The button that had focus is gone; the panel's focus trap would otherwise
    // drop it on the dialog itself.
    textareaRef.current?.focus();
  };

  const showCounter = count >= COUNTER_FROM;

  return (
    <section className={styles.notes} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.notesHeading}>
        {t('schedule.notes.heading')}
      </h3>

      {!online ? (
        <p className={styles.notesMessage} role="status">
          {t('schedule.notes.offline')}
        </p>
      ) : list.kind === 'unavailable' ? (
        <p className={styles.notesMessage}>{t('schedule.notes.unavailable')}</p>
      ) : (
        <form className={styles.notesForm} onSubmit={onSubmit} noValidate>
          <label htmlFor={fieldId} className={styles.srOnly}>
            {t('schedule.notes.field_label')}
          </label>
          <textarea
            ref={textareaRef}
            id={fieldId}
            className={`${styles.notesInput} ${tooLong ? styles.notesInputError : ''}`}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSaveError(null);
            }}
            placeholder={t('schedule.notes.placeholder')}
            rows={3}
            // The student's own words, in whichever language they wrote them.
            dir="auto"
            aria-invalid={tooLong}
            aria-describedby={
              [showCounter ? counterId : '', saveError ? saveErrorId : ''].filter(Boolean).join(' ') ||
              undefined
            }
          />

          <div className={styles.notesActions}>
            {showCounter && (
              <p
                id={counterId}
                className={`${styles.notesCounter} ${tooLong ? styles.notesCounterOver : ''}`}
              >
                <bdi dir="ltr" className="num" aria-hidden="true">
                  {count} / {COURSE_NOTE_MAX}
                </bdi>
                <span className={styles.srOnly}>
                  {tooLong
                    ? t('schedule.notes.too_long', { max: COURSE_NOTE_MAX })
                    : t('schedule.notes.counter_sr', { count, max: COURSE_NOTE_MAX })}
                </span>
              </p>
            )}
            <button type="submit" className={styles.notesSave} disabled={!canSave}>
              {saving ? t('schedule.notes.saving') : t('schedule.notes.save')}
            </button>
          </div>

          {tooLong && (
            <p className={styles.notesFieldError} aria-hidden="true">
              {t('schedule.notes.too_long', { max: COURSE_NOTE_MAX })}
            </p>
          )}
          {saveError && (
            <p id={saveErrorId} className={styles.notesFieldError} role="alert">
              {t(`schedule.notes.${saveError}`)}
            </p>
          )}
          {/* Always in the DOM so the announcement is reliable; empty when idle. */}
          <p className={styles.notesSaved} role="status" aria-live="polite">
            {saved ? t('schedule.notes.saved') : ''}
          </p>
        </form>
      )}

      {online && list.kind === 'loading' && (
        <div className={styles.notesSkeleton} aria-hidden="true">
          <span className={`${styles.skeleton} ${styles.notesSkeletonLine}`} />
          <span className={`${styles.skeleton} ${styles.notesSkeletonLine}`} />
          <span className={`${styles.skeleton} ${styles.notesSkeletonShort}`} />
        </div>
      )}

      {online && list.kind === 'error' && (
        <div className={styles.notesErrorBox} role="alert">
          <p className={styles.notesMessage}>{t('schedule.notes.load_error')}</p>
          <button type="button" className={styles.retryButton} onClick={() => void load()}>
            {t('actions.retry')}
          </button>
        </div>
      )}

      {online && list.kind === 'ready' && list.notes.length === 0 && (
        <p className={styles.notesMessage}>{t('schedule.notes.empty')}</p>
      )}

      {online && list.kind === 'ready' && list.notes.length > 0 && (
        <ul className={styles.notesList} aria-label={t('schedule.notes.list_label')}>
          {list.notes.map((note) => (
            <NoteItem key={note.id} note={note} onDeleted={onDeleted} />
          ))}
        </ul>
      )}
    </section>
  );
}

function NoteItem({ note, onDeleted }: { note: CourseNote; onDeleted: (id: string) => void }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [failed, setFailed] = useState(false);
  const timeId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  // Focus follows the swap between the delete button and the confirm pair, so
  // a keyboard user is never left on a button that just disappeared.
  const moveFocus = useRef<'confirm' | 'delete' | null>(null);

  useEffect(() => {
    if (moveFocus.current === 'confirm') confirmRef.current?.focus();
    if (moveFocus.current === 'delete') deleteRef.current?.focus();
    moveFocus.current = null;
  }, [phase]);

  const confirmDelete = async () => {
    setPhase('deleting');
    setFailed(false);
    try {
      await deleteCourseNote(note.id);
      onDeleted(note.id);
    } catch (err) {
      // 404: it is already gone (deleted from the app, or another tab), which
      // is the outcome asked for.
      if (err instanceof ApiError && err.status === 404) {
        onDeleted(note.id);
        return;
      }
      setFailed(true);
      moveFocus.current = 'delete';
      setPhase('idle');
    }
  };

  return (
    <li className={styles.noteItem}>
      {/* dir="auto": a French note in the Arabic interface, or the reverse,
          still runs in its own direction. */}
      <p className={styles.noteBody} dir="auto">
        {note.body}
      </p>
      <div className={styles.noteFooter}>
        <time id={timeId} className={styles.noteTime} dateTime={note.createdAt}>
          <NotificationTime iso={note.createdAt} />
        </time>

        {phase === 'idle' ? (
          <button
            ref={deleteRef}
            type="button"
            className={styles.noteDelete}
            onClick={() => {
              moveFocus.current = 'confirm';
              setPhase('confirm');
            }}
            aria-label={t('schedule.notes.delete_label')}
            aria-describedby={timeId}
          >
            {t('schedule.notes.delete')}
          </button>
        ) : (
          <span className={styles.noteConfirm}>
            <button
              ref={confirmRef}
              type="button"
              className={`${styles.noteDelete} ${styles.noteDeleteConfirm}`}
              onClick={() => void confirmDelete()}
              disabled={phase === 'deleting'}
              // No aria-label: the visible "Supprimer ?" is the name, and the
              // note's date says which note.
              aria-describedby={timeId}
            >
              {phase === 'deleting' ? t('schedule.notes.deleting') : t('schedule.notes.confirm')}
            </button>
            <button
              type="button"
              className={styles.noteDelete}
              onClick={() => {
                moveFocus.current = 'delete';
                setPhase('idle');
              }}
              disabled={phase === 'deleting'}
            >
              {t('schedule.notes.cancel')}
            </button>
          </span>
        )}
      </div>
      {failed && (
        <p className={styles.notesFieldError} role="alert">
          {t('schedule.notes.delete_error')}
        </p>
      )}
    </li>
  );
}
