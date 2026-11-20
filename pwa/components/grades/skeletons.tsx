import styles from './grades.module.css';

/**
 * §5: "Skeleton blocks (gray rounded rectangles matching each real element's
 * footprint)." The footprints below are taken from the components they stand in
 * for — the hero is the jade card's own box, the rows are the table's row
 * height — so nothing on the screen resizes when the data lands.
 *
 * All blocks share one animation name and therefore one timeline, which is what
 * makes §5's "sweeps left->right across every skeleton block in parallel" true
 * rather than each block starting from its own mount.
 */

function Block({ className }: { className: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

/** Tab strip + cards row + table: the whole screen's first load. */
export function ScreenSkeleton() {
  return (
    <>
      <div className={styles.head}>
        <div className={styles.skeletonTabs}>
          <Block className={styles.skeletonTab} />
          <Block className={styles.skeletonTab} />
        </div>
        <ActionsSkeleton />
      </div>

      {/* The cards row at its loaded footprint: the hero's box (one block, the
          hero's radius and height) and the history card around a chart block. */}
      <div className={styles.cardsRow}>
        <Block className={styles.skeletonHero} />
        <div className={styles.historyCard}>
          <Block className={styles.skeletonHistoryTitle} />
          <Block className={styles.skeletonHistoryChart} />
        </div>
      </div>

      <TableSkeleton />
    </>
  );
}

/** "Calculatrice" and "Exporter PDF" at the end of the head row, 8px apart. */
export function ActionsSkeleton() {
  return (
    <div className={styles.headActions}>
      <Block className={styles.skeletonCalc} />
      <Block className={styles.skeletonExport} />
    </div>
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
