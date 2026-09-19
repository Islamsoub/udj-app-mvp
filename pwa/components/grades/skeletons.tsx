import styles from './grades.module.css';

/**
 * §5: "Skeleton blocks (gray rounded rectangles matching each real element's
 * footprint)." The footprints below are taken from the components they stand in
 * for — the hero's gauge is the ring's 104px circle, the rows are the table's
 * row height — so nothing on the screen resizes when the data lands.
 *
 * All blocks share one animation name and therefore one timeline, which is what
 * makes §5's "sweeps left->right across every skeleton block in parallel" true
 * rather than each block starting from its own mount.
 */

function Block({ className }: { className: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

/** Tab strip + hero + table: the whole screen's first load. */
export function ScreenSkeleton() {
  return (
    <>
      <div className={styles.skeletonTabs}>
        <Block className={styles.skeletonTab} />
        <Block className={styles.skeletonTab} />
      </div>

      <div className={styles.skeletonHero}>
        <Block className={styles.skeletonRing} />
        <div className={styles.skeletonHeroText}>
          <Block className={styles.skeletonLineShort} />
          <Block className={styles.skeletonLineHero} />
          <Block className={styles.skeletonLineMedium} />
        </div>
      </div>

      <TableSkeleton />
    </>
  );
}

/** Just the rows — a tab switch that has to fetch a semester keeps its tabs and
 *  its hero, so only this part is replaced. */
export function TableSkeleton() {
  return (
    <div className={styles.skeletonRows}>
      {/* Six: the seeded semesters carry six to eight subjects, so the block is
          about the height the real table will be and the page does not jump. */}
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <Block key={row} className={styles.skeletonRow} />
      ))}
    </div>
  );
}
