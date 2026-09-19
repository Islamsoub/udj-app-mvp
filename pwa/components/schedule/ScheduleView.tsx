'use client';

import { useState } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import { SlidePanel } from '@/components/panel/SlidePanel';
import { SegmentedControl } from '@/components/segmented/SegmentedControl';
import { useLayoutMode } from '@/components/shell/useLayoutMode';
import type { ScheduleEntry, ScheduleResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { CourseDetail, DAY_KEYS, courseTitle } from './CourseDetail';
import { DayList } from './DayList';
import { ChevronIcon } from './icons';
import { WeekGrid } from './WeekGrid';
import {
  TEACHING_DAYS,
  addDays,
  dateForDay,
  defaultFocus,
  sameDay,
  startOfWeek,
} from './week';
import styles from './schedule.module.css';

type ViewMode = 'week' | 'day';

const PANEL_ID = 'schedule-panel';

/**
 * The loaded schedule: the Day/Week toggle, week navigation, the two views and
 * the course detail panel.
 *
 * `today` is taken once, when the screen loads, rather than read on every
 * render. A component that calls `new Date()` in its body renders differently on
 * two consecutive frames, and the one thing that depends on it here — which
 * column is marked "today" — must not flicker. The cost is that a tab left open
 * across midnight keeps yesterday's marker until it is reloaded, which is the
 * better of the two failure modes.
 */
export function ScheduleView({ data, today }: { data: ScheduleResponse; today: Date }) {
  const { t, lang, dir } = useI18n();

  const entries = data.entries;

  /*
   * BELOW 640px THE WEEK GRID IS NOT USED, and the toggle is not shown either.
   * Five columns of proportional blocks on a phone gives each class about 60px
   * of width, which is not enough for a subject name — and a toggle whose second
   * option is unavailable is a control that lies. So the view is forced to `day`
   * and the toggle is simply absent, rather than present-but-crippled; the day
   * view is complete on its own, so nothing is out of reach.
   */
  const isPhone = useLayoutMode() === 'mobile';

  const [preferredView, setPreferredView] = useState<ViewMode>('week');
  const view: ViewMode = isPhone ? 'day' : preferredView;

  /*
   * One decision drives both: the date the screen opens on. Deriving the week
   * and the day separately is what put a Saturday visitor on the previous
   * Sunday — the week containing today had already ended while the next
   * teaching day was in the week after.
   */
  const [focus] = useState(() => defaultFocus(entries, today));

  const [weekStart, setWeekStart] = useState(() => startOfWeek(focus));
  const [day, setDay] = useState<number>(() => focus.getDay());

  const [selected, setSelected] = useState<ScheduleEntry | null>(null);

  // "Am I where the screen opened?" rather than "is this the calendar week
  // containing today?" — the two differ at a weekend, and the button has to
  // agree with what it does.
  const atFocusWeek = sameDay(weekStart, startOfWeek(focus));
  const shownDate = dateForDay(weekStart, day);
  const isToday = sameDay(shownDate, today);

  /** Paging moves by a week in the week view and by a teaching day in the day
   *  view — the arrows step whatever unit the student is looking at. */
  const step = (direction: 1 | -1) => {
    if (view === 'week') {
      setWeekStart((current) => addDays(current, direction * 7));
      return;
    }

    const index = TEACHING_DAYS.indexOf(day as (typeof TEACHING_DAYS)[number]);
    const next = index + direction;

    // Walking off either end of the teaching week lands on the adjacent week's
    // far end, so Thursday -> next Sunday rather than a dead button.
    if (next < 0) {
      setWeekStart((current) => addDays(current, -7));
      setDay(TEACHING_DAYS[TEACHING_DAYS.length - 1]);
      return;
    }
    if (next >= TEACHING_DAYS.length) {
      setWeekStart((current) => addDays(current, 7));
      setDay(TEACHING_DAYS[0]);
      return;
    }

    setDay(TEACHING_DAYS[next]);
  };

  /** Back to where the screen opened — the same date `focus` resolved to, so
   *  the button always lands on what the student first saw. */
  const goToFocus = () => {
    setWeekStart(startOfWeek(focus));
    if (view === 'day') setDay(focus.getDay());
  };

  const monthName = new Intl.DateTimeFormat(lang, { month: 'long' }).format(
    view === 'week' ? weekStart : shownDate
  );

  return (
    <>
      <div className={styles.toolbar}>
        {!isPhone && (
          <SegmentedControl
            options={[
              { id: 'week', label: t('schedule.view.week') },
              { id: 'day', label: t('schedule.view.day') },
            ]}
            selectedId={view}
            onSelect={(id) => setPreferredView(id as ViewMode)}
            label={t('schedule.view.label')}
            panelId={PANEL_ID}
          />
        )}

        <div
          className={styles.nav}
          /*
             One chevron glyph serves both arrows, flipped by the stylesheet. The
             flip is direction dependent — "previous" points left in French and
             right in Arabic — and a transform is never mirrored by `dir`, so the
             sign is read from the active direction and handed down as a custom
             property, which is what §6 prescribes.
          */
          style={{ '--chevron-flip': dir === 'rtl' ? -1 : 1 } as React.CSSProperties}
        >
          <button
            type="button"
            className={styles.navButton}
            onClick={() => step(-1)}
            aria-label={t(view === 'week' ? 'schedule.nav.prev_week' : 'schedule.nav.prev_day')}
          >
            <ChevronIcon className={`${styles.navIcon} ${styles.navIconPrev}`} />
          </button>

          <p className={styles.navLabel} aria-live="polite">
            {/*
              TWO PASSES, and the split matters. Interpolated puts every value it
              substitutes on the Latin face, which is right for the digits and
              wrong for "سبتمبر" — Plus Jakarta Sans has no Arabic glyphs, so an
              Arabic month name pushed through it falls back to whatever the
              stack resolves next.

              So the WORDS are substituted first, by t() itself, which leaves the
              placeholders it was not given intact; Interpolated then sees only
              {{day}} and {{year}} and wraps exactly the two things that should
              be Latin.
            */}
            <Interpolated
              template={t(view === 'week' ? 'schedule.nav.week_of' : 'schedule.nav.day_of', {
                month: monthName,
                weekday: t(DAY_KEYS[day] ?? 'schedule.days.sunday'),
              })}
              values={{ day: shownDate.getDate(), year: shownDate.getFullYear() }}
            />
          </p>

          <button
            type="button"
            className={styles.navButton}
            onClick={() => step(1)}
            aria-label={t(view === 'week' ? 'schedule.nav.next_week' : 'schedule.nav.next_day')}
          >
            <ChevronIcon className={styles.navIcon} />
          </button>

          {/*
            The way back. Disabled rather than hidden when it would do nothing —
            §3 gives disabled controls 0.5 opacity and not-allowed, and a button
            that appears and vanishes as the student pages is harder to aim at
            than one that greys out.
          */}
          <button
            type="button"
            className={styles.todayButton}
            onClick={goToFocus}
            disabled={view === 'week' ? atFocusWeek : sameDay(shownDate, focus)}
          >
            {t(view === 'week' ? 'schedule.nav.this_week' : 'schedule.nav.today')}
          </button>
        </div>
      </div>

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-label={t(view === 'week' ? 'schedule.view.week' : 'schedule.view.day')}
        tabIndex={-1}
        className={styles.viewport}
      >
        {view === 'week' ? (
          <WeekGrid
            entries={entries}
            weekStart={weekStart}
            today={today}
            onSelect={setSelected}
          />
        ) : (
          <>
            <DayHeading day={day} date={shownDate} isToday={isToday} />
            <DayList
              entries={entries}
              day={day}
              date={shownDate}
              onSelect={setSelected}
              empty={<EmptyDay />}
            />
          </>
        )}
      </div>

      {/*
        The timetable the API returns is the one valid TODAY: /student/schedule
        filters effectiveDate/expiryDate against `new Date()` server-side and
        returns neither field, so the client cannot re-filter for the week being
        viewed. Saying so once, when the student has navigated away from the week
        the screen opened on, is the honest alternative to presenting a
        projection as history.

        BELOW the grid, not above it. §9 requires the grid structure not to move
        when the week changes, and a line that appears on the first press of
        "next" pushes everything under it down by its own height — measured at
        57px before this was moved, which is a visible jump exactly when the
        student is watching the blocks fade.
      */}
      {!atFocusWeek && (
        <p className={styles.notice} role="status">
          {t('schedule.other_week_notice')}
        </p>
      )}

      <SlidePanel
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected === null ? '' : courseTitle(selected, lang)}
        subtitle={selected === null ? undefined : `${selected.subject.code} · ${selected.room}`}
      >
        {selected !== null && (
          <CourseDetail
            entry={selected}
            dayLabel={t(DAY_KEYS[selected.dayOfWeek] ?? 'schedule.days.sunday')}
          />
        )}
      </SlidePanel>
    </>
  );
}

function DayHeading({ day, date, isToday }: { day: number; date: Date; isToday: boolean }) {
  const { t } = useI18n();

  return (
    <h2 className={styles.dayHeading} aria-current={isToday ? 'date' : undefined}>
      {t(DAY_KEYS[day] ?? 'schedule.days.sunday')}{' '}
      <span className={`${styles.dayHeadingDate} num`}>{date.getDate()}</span>
      {isToday && <span className={styles.todayPill}>{t('schedule.today_label')}</span>}
    </h2>
  );
}

/**
 * One day with nothing on it — NOT the same as a timetable that does not exist.
 * This says the day is free; Schedule.tsx says when nothing has been published
 * at all. Conflating them would tell a student whose faculty has published
 * nothing that they simply have no class today.
 */
function EmptyDay() {
  const { t } = useI18n();
  return (
    <div className={styles.emptyBox}>
      <p className={styles.emptyText}>{t('schedule.empty.day')}</p>
    </div>
  );
}

