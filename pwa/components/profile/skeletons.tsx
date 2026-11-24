import styles from './profile.module.css';

/**
 * The account half's footprint: the centred identity block (avatar, name,
 * matricule, pill, line), then three tile groups — Informations (5 rows),
 * Parcours (4), Contacter (4). Built from the real identity, group and row
 * classes, so nothing moves when the data crossfades in.
 */
export function ProfileSkeleton() {
  return (
    <>
      <div className={styles.identity} aria-hidden="true">
        <div className={`${styles.skeleton} ${styles.avatar}`} />
        <div className={`${styles.skeleton} ${styles.skeletonName}`} />
        <div className={`${styles.skeleton} ${styles.skeletonId}`} />
        <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
      </div>

      <div className={styles.groups}>
      {[5, 4, 4].map((rows, group) => (
        <div key={group} className={styles.tileGroup} aria-hidden="true">
          <div className={styles.tileGroupLabel}>
            <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
          </div>
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={styles.tileRow}>
              <div className={`${styles.skeleton} ${styles.tileIcon}`} />
              <div className={`${styles.skeleton} ${styles.skeletonRowLabel}`} />
              <div className={`${styles.skeleton} ${styles.skeletonRowValue}`} />
            </div>
          ))}
        </div>
      ))}
      </div>
    </>
  );
}

/** The Notifications card while the account loads: title, line, three rows, Heures calmes. */
export function NotificationsSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.skeleton} ${styles.skeletonCardTitle}`} />
      <div className={`${styles.skeleton} ${styles.skeletonCardNote}`} />
      {[0, 1, 2].map((row) => (
        <div key={row} className={styles.settingsRow}>
          <div className={`${styles.skeleton} ${styles.skeletonRowLabel}`} />
          <div className={`${styles.skeleton} ${styles.skeletonSwitch}`} />
        </div>
      ))}
      <div className={`${styles.settingsRow} ${styles.settingsRowStacked}`}>
        <div className={`${styles.skeleton} ${styles.skeletonQuiet}`} />
      </div>
    </div>
  );
}
