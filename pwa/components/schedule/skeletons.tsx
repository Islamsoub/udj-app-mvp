import { HOUR_PX, TEACHING_DAYS } from './week';
import styles from './schedule.module.css';

/**
 * §5: "Skeleton blocks (gray rounded rectangles matching each real element's
 * footprint)." The footprints below are the real ones — the toggle's 44px row,
 * the grid's HOUR_PX scale — so nothing resizes when the timetable lands.
 *
 * All blocks share one animation name and therefore one timeline, which is what
 * makes §5's "sweeps left->right across every skeleton block in parallel" true
 * rather than each block starting from its own mount.
 */

function Block({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`${styles.skeleton} ${className}`} style={style} />;
}

/** A plausible day: two morning classes and one after lunch. */
const SKELETON_SLOTS = [
  { top: 0, height: 1.5 },
  { top: 2, height: 1.5 },
  { top: 5, height: 2 },
];

export function ScheduleSkeleton() {
  return (
    <>
      <div className={styles.toolbar}>
        <Block className={styles.skeletonToggle} />
        <Block className={styles.skeletonNav} />
      </div>

      <div className={styles.week}>
        <div className={styles.weekHead}>
          <span className={styles.gutterHead} aria-hidden="true" />
          {TEACHING_DAYS.map((day) => (
            <div key={day} className={styles.dayHead}>
              <Block className={styles.skeletonDayHead} />
            </div>
          ))}
        </div>

        <div className={styles.weekBody} style={{ height: `${HOUR_PX * 7}px` }}>
          <div className={styles.gutter} />
          {TEACHING_DAYS.map((day) => (
            <div
              key={day}
              className={styles.dayColumn}
              style={{ '--hour-px': `${HOUR_PX}px` } as React.CSSProperties}
            >
              {/* Offset per column so the skeleton reads as a timetable rather
                  than as five identical bars. */}
              {SKELETON_SLOTS.map((slot, index) => (
                <Block
                  key={index}
                  className={styles.skeletonBlock}
                  style={{
                    top: `${(slot.top + (day % 2) * 0.5) * HOUR_PX}px`,
                    height: `${slot.height * HOUR_PX}px`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
