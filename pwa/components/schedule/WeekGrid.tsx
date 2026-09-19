'use client';

import type { ScheduleEntry } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { DAY_SHORT_KEYS } from './CourseDetail';
import { courseType, typeClass, typeLabelKey } from './course-type';
import { Crossfade } from './Crossfade';
import {
  HOUR_PX,
  TEACHING_DAYS,
  blockBox,
  dateForDay,
  entriesForDay,
  formatTime,
  hourMarks,
  sameDay,
  timeBounds,
} from './week';
import styles from './schedule.module.css';

/**
 * The week view: a time gutter and five day columns, drawn to scale.
 *
 * PROPORTIONAL, NOT ROW-PER-HOUR. The timetable mixes 90- and 120-minute slots
 * and starts them on both the hour and the half-hour — 08:00-09:30 sits beside
 * 08:00-10:00, and 10:30-12:00 starts mid-row. A table of hour cells cannot
 * express that without either rounding classes to the hour or drawing two
 * different lengths at the same size, so every block is positioned and sized
 * from its real minutes against a fixed px-per-hour scale.
 *
 * MIRRORING IS FREE. The columns are a CSS grid, and grid tracks follow `dir`,
 * so in Arabic the gutter and Sunday move to the right-hand edge together with
 * no second rule. The blocks are placed with inset-block-start, which is the
 * vertical axis and does not mirror — which is correct: 09:00 is below 08:00 in
 * both languages.
 */
export function WeekGrid({
  entries,
  weekStart,
  today,
  onSelect,
}: {
  entries: ScheduleEntry[];
  weekStart: Date;
  today: Date;
  onSelect: (entry: ScheduleEntry) => void;
}) {
  const { t, lang } = useI18n();

  const bounds = timeBounds(entries);
  const hours = hourMarks(bounds);
  const gridHeight = ((bounds.endMin - bounds.startMin) / 60) * HOUR_PX;

  return (
    <div className={styles.week}>
      {/*
        The header is outside the Crossfade on purpose: §9 says the grid
        structure does not animate, and the column headers are structure. Their
        dates do change with the week, but they change in place.
      */}
      <div className={styles.weekHead}>
        <span className={styles.gutterHead} aria-hidden="true" />
        {TEACHING_DAYS.map((day) => {
          const date = dateForDay(weekStart, day);
          const isToday = sameDay(date, today);

          return (
            <div
              key={day}
              className={`${styles.dayHead} ${isToday ? styles.dayHeadToday : ''}`}
              /*
               * The jade tint says "today" visually; this says it to assistive
               * tech. aria-current="date" is the token meant for exactly this,
               * so no visually-hidden text is needed to carry the same fact.
               */
              aria-current={isToday ? 'date' : undefined}
            >
              <span className={styles.dayName}>{t(DAY_SHORT_KEYS[day])}</span>
              {/* A date is a number, so it stays on the Latin face in Arabic. */}
              <span className={`${styles.dayDate} num`}>{date.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.weekBody} style={{ height: `${gridHeight}px` }}>
        {/* Time gutter. Labels sit ON the hour rules, so they are nudged up by
            half a line to read as marking the line rather than the space. */}
        <div className={styles.gutter}>
          {hours.map((minute) => (
            <span
              key={minute}
              className={`${styles.gutterLabel} num`}
              style={{ top: `${((minute - bounds.startMin) / 60) * HOUR_PX}px` }}
            >
              {formatTime(minute)}
            </span>
          ))}
        </div>

        {TEACHING_DAYS.map((day) => {
          const date = dateForDay(weekStart, day);
          const isToday = sameDay(date, today);

          return (
            <div
              key={day}
              className={`${styles.dayColumn} ${isToday ? styles.dayColumnToday : ''}`}
              // The hour rules are a repeating gradient rather than N elements:
              // the spacing is uniform by construction, so there is nothing for
              // a list of divs to get wrong.
              style={{ '--hour-px': `${HOUR_PX}px` } as React.CSSProperties}
            >
              {/*
                Only the blocks fade. Keyed on the week so paging re-runs it, and
                on the day so one column's swap cannot be attributed to another.
              */}
              <Crossfade token={`${weekStart.getTime()}:${day}`} fill>
                {entriesForDay(entries, day).map((entry) => {
                  const box = blockBox(entry, bounds);
                  if (box === null) return null;

                  const type = courseType(entry.type);
                  const subject = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={`${styles.block} ${typeClass(type)}`}
                      style={{ top: `${box.top}px`, height: `${box.height}px` }}
                      onClick={() => onSelect(entry)}
                      /*
                       * The visible text is fragmented into type, subject and
                       * room, and a 90px-tall box truncates it. The full
                       * sentence goes on the button so assistive tech reads the
                       * class rather than the pieces that happened to fit.
                       */
                      aria-label={`${subject} — ${t(typeLabelKey(type))}, ${entry.startTime}–${entry.endTime}, ${entry.room}`}
                    >
                      <span className={styles.blockType} aria-hidden="true">
                        {type}
                      </span>
                      <span className={styles.blockSubject} aria-hidden="true">
                        {subject}
                      </span>
                      <span className={`${styles.blockMeta} num`} aria-hidden="true">
                        {entry.startTime} · {entry.room}
                      </span>
                    </button>
                  );
                })}
              </Crossfade>
            </div>
          );
        })}
      </div>

      {/*
        The legend. §10 again: the four colours are already paired with a code on
        every block, and this says what the codes mean — a first-year student has
        no reason to know TP from TD.
      */}
      <p className={styles.legend}>{t('schedule.legend')}</p>
    </div>
  );
}
