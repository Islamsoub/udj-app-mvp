import { useId, type ReactNode } from 'react';
import styles from './profile.module.css';

/** The prototype's .tile-icon tints (its five, onto our tokens). */
export type Tone = 'jade' | 'info' | 'warning' | 'exam' | 'danger';

const TONE_CLASS: Record<Tone, string> = {
  jade: styles.toneJade,
  info: styles.toneInfo,
  warning: styles.toneWarning,
  exam: styles.toneExam,
  danger: styles.toneDanger,
};

/**
 * The prototype's .tile-group: a white group with its label inside, on the
 * first line (.tile-group-lbl), then the rows. The label is the group's h2.
 */
export function TileGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className={styles.tileGroup} aria-labelledby={id}>
      <h2 className={styles.tileGroupLabel} id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A group of label / value rows, as a description list. */
export function TileList({ children }: { children: ReactNode }) {
  return <dl className={styles.tileList}>{children}</dl>;
}

/**
 * .tile-row: the coloured tile on the start, the label, the value on the end.
 * The icon is decoration; the label names the row.
 */
export function TileRow({
  icon,
  tone,
  label,
  children,
}: {
  icon: ReactNode;
  tone: Tone;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.tileRow}>
      <dt className={styles.trHead}>
        <TileIcon tone={tone}>{icon}</TileIcon>
        <span className={styles.trLabel}>{label}</span>
      </dt>
      <dd className={styles.trValue}>{children}</dd>
    </div>
  );
}

/** The 34px tinted tile itself, for rows that are not label / value pairs. */
export function TileIcon({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`${styles.tileIcon} ${TONE_CLASS[tone]}`} aria-hidden="true">
      {children}
    </span>
  );
}
