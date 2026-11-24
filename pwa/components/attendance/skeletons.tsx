import styles from './attendance.module.css';

/**
 * §5: "Skeleton blocks (gray rounded rectangles matching each real element's
 * footprint)." Each card is built from the loaded card's own classes — the
 * hero's wrap and breakdown, the table and the phone list, the absence rows —
 * with blocks at the loaded lines' heights, so nothing resizes when the data
 * lands and the table/list switch happens at the same breakpoint.
 *
 * All blocks share one animation name and therefore one timeline, which is what
 * makes §5's "sweeps left->right across every skeleton block in parallel" true.
 */

function Block({ className }: { className: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

/* Four rows, not eight: the skeleton stands for "a list is coming". */
const ROWS = [0, 1, 2, 3];

export function AttendanceSkeleton() {
  return (
    <>
      <div className={styles.skeletonHero}>
        <div className={styles.heroWrap}>
          <Block className={styles.skeletonRing} />
          <div className={styles.skeletonHeroText}>
            <Block className={styles.skeletonHeroLabel} />
            <Block className={styles.skeletonHeroPill} />
            <Block className={styles.skeletonHeroSummary} />
          </div>
          <div className={styles.heroBreakdown}>
            <Block className={styles.skeletonHeroLevel} />
            <Block className={styles.skeletonHeroLevel} />
            <Block className={styles.skeletonHeroLevel} />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <Block className={styles.skeletonCardTitle} />
        <Block className={styles.skeletonNote} />

        <div className={styles.tableWrap}>
          <table className={styles.dataTable} aria-hidden="true">
            <thead>
              <tr>
                {[0, 1, 2, 3].map((n) => (
                  <th key={n}>
                    <Block className={styles.skeletonHeadCell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((n) => (
                <tr key={n}>
                  {[0, 1, 2, 3].map((c) => (
                    <td key={c}>
                      <Block className={styles.skeletonCell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className={styles.subjectList} aria-hidden="true">
          {ROWS.map((n) => (
            <li key={n} className={styles.attendSubject}>
              <Block className={styles.skeletonSubject} />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.card}>
        <div className={styles.absencesHead}>
          <Block className={styles.skeletonCardTitleInline} />
          <Block className={styles.skeletonStrip} />
        </div>
        <ul className={styles.absences}>
          {[0, 1, 2].map((n) => (
            <li key={n} className={styles.skeletonAbsenceRow}>
              <Block className={styles.skeletonAbsence} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
