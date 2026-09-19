'use client';

import type { ScheduleEntry } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { courseType, typeClass, typeLabelKey } from './course-type';
import { Crossfade } from './Crossfade';
import { RoomIcon, ProfessorIcon } from './icons';
import { entriesForDay } from './week';
import styles from './schedule.module.css';

/**
 * One day's classes, as a list.
 *
 * The day view rather than a one-column grid: with a single day there is nothing
 * to line up across columns, so the proportional scale buys nothing and costs
 * the room to spell out the professor and the full subject name. This is also
 * the only view below 640px, where that room matters most.
 */
export function DayList({
  entries,
  day,
  date,
  onSelect,
  empty,
}: {
  entries: ScheduleEntry[];
  day: number;
  /** The calendar date this day falls on, for the crossfade token. */
  date: Date;
  onSelect: (entry: ScheduleEntry) => void;
  /** Rendered when this particular day has nothing on it. */
  empty: React.ReactNode;
}) {
  const { t, lang } = useI18n();

  const dayEntries = entriesForDay(entries, day);

  return (
    // Same treatment as the week grid: paging days fades the content, never the
    // frame around it.
    <Crossfade token={String(date.getTime())}>
      {dayEntries.length === 0 ? (
        empty
      ) : (
        <ul className={styles.dayList}>
          {dayEntries.map((entry) => {
            const type = courseType(entry.type);
            const subject = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={styles.dayItem}
                  onClick={() => onSelect(entry)}
                  aria-label={`${subject} — ${t(typeLabelKey(type))}, ${entry.startTime}–${entry.endTime}, ${entry.room}`}
                >
                  {/* Times on the Latin face in both languages, and stacked so
                      the column of start times reads straight down the list. */}
                  <span className={styles.dayTime} aria-hidden="true">
                    <span className={`${styles.dayStart} num`}>{entry.startTime}</span>
                    <span className={`${styles.dayEnd} num`}>{entry.endTime}</span>
                  </span>

                  {/* The type's colour as a rule down the inline-start edge —
                      mirrored by `dir`, and never the only signal: the code sits
                      beside the subject name. */}
                  <span className={`${styles.dayRule} ${typeClass(type)}`} aria-hidden="true" />

                  <span className={styles.dayBody}>
                    <span className={styles.dayTop} aria-hidden="true">
                      <span className={styles.daySubject}>{subject}</span>
                      <span className={`${styles.typePill} ${typeClass(type)}`}>{type}</span>
                    </span>

                    <span className={styles.dayMeta} aria-hidden="true">
                      <span className={styles.dayMetaItem}>
                        <RoomIcon className={styles.dayMetaIcon} />
                        <span className="num">{entry.room}</span>
                      </span>
                      <span className={styles.dayMetaItem}>
                        <ProfessorIcon className={styles.dayMetaIcon} />
                        {entry.professorName}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Crossfade>
  );
}
