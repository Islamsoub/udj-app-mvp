import styles from './attendance.module.css';

/**
 * §5: "Skeleton blocks (gray rounded rectangles matching each real element's
 * footprint)." The footprints below are the real ones — the 132px ring, the 44px
 * segmented strip, the bar rows — so nothing resizes when the data lands.
 *
 * All blocks share one animation name and therefore one timeline, which is what
 * makes §5's "sweeps left->right across every skeleton block in parallel" true
 * rather than each block starting from its own mount.
 */

function Block({ className }: { className: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

export function AttendanceSkeleton() {
  return (
    <>
      <div className={styles.skeletonHero}>
        <Block className={styles.skeletonRing} />
        {/* One block per line of the loaded hero text, at its height and
            margin, so the skeleton and the loaded hero are one height. */}
        <div className={styles.skeletonHeroText}>
          <Block className={styles.skeletonHeroLabel} />
          <Block className={styles.skeletonHeroFigure} />
          <Block className={styles.skeletonHeroSessions} />
          <Block className={styles.skeletonHeroThreshold} />
          <Block className={styles.skeletonHeroCounts} />
        </div>
      </div>

      {/* The "Par matière" card: the same card, title and note heights, and
          rows on the loaded rows' own class, so their padding and hairlines
          are the loaded ones. */}
      <div className={styles.card}>
        <Block className={styles.skeletonCardTitle} />
        <Block className={styles.skeletonNote} />
        <div>
          {/* Four, not eight. The skeleton stands for "a list is coming", and a
              full-length one on a screen this tall is a wall of grey. */}
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className={styles.subject}>
              <Block className={styles.skeletonSubject} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.absencesHead}>
          <Block className={styles.skeletonHeading} />
          <Block className={styles.skeletonStrip} />
        </div>
        <div className={styles.skeletonRows}>
          {[0, 1, 2].map((n) => (
            <Block key={n} className={styles.skeletonAbsence} />
          ))}
        </div>
      </div>
    </>
  );
}
