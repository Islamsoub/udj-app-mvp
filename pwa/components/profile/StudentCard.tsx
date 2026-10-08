'use client';

import { useState } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import { mentionKey } from '@/components/grades/model';
import type { MeResponse } from '@/lib/api-types';
import { fmtPercent, fmtRatio } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import styles from './profile.module.css';

/**
 * Everything GET /student/me says about the student, read-only — there is no
 * endpoint that edits any of it; changes go through the scolarité.
 *
 * Three groups: who (name, ID, email, status), where (programme and faculty,
 * with the faculty's contact details, which are the ones a student actually
 * needs from this page), and how it is going (the same stats the dashboard
 * draws, as plain figures).
 */
export function StudentCard({
  me,
  anyPublished,
}: {
  me: MeResponse;
  /** Whether any semester has published results; null when that is unknown. */
  anyPublished: boolean | null;
}) {
  const { t, lang } = useI18n();
  const ar = lang === 'ar';

  const { gpa, mention, semesterCredits, totalCredits, attendancePercentage } = me.stats;
  const mentionLabelKey = mention === null ? null : mentionKey(mention);

  return (
    <>
      <section className={`${styles.card} ${styles.identity}`}>
        <Avatar photoUrl={me.photoUrl} firstName={me.firstName} lastName={me.lastName} />

        <div className={styles.identityText}>
          <p className={styles.name}>
            {me.firstName} {me.lastName}
          </p>
          {/* DM Mono via `.mono`, in both languages. The ID is an identifier the
              student reads out at a counter, so it must look the same always. */}
          <p className={`${styles.studentId} mono`}>{me.studentIdDisplay}</p>
          <p className={styles.email}>
            {/* An address, so its direction is its own, not the page's. */}
            <bdi>{me.email}</bdi>
          </p>
          <span className={`${styles.statusPill} ${STATUS_CLASS[me.status] ?? ''}`}>
            {t(STATUS_KEY[me.status] ?? 'profile.status.unknown')}
          </span>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('profile.studies.title')}</h2>

        <dl className={`${styles.card} ${styles.facts}`}>
          <Fact label={t('profile.studies.programme')}>
            {ar ? me.programme.nameAr : me.programme.nameFr}
            <span className={`${styles.code} num`}>{me.programme.code}</span>
          </Fact>
          <Fact label={t('profile.studies.level')}>
            {t(LEVEL_KEY[me.programme.level] ?? 'profile.level.unknown')}
          </Fact>
          <Fact label={t('profile.studies.semester')}>
            <Interpolated
              template={t('profile.studies.semester_value')}
              values={{ current: me.currentSemester, total: me.programme.durationSemesters }}
            />
          </Fact>
          <Fact label={t('profile.studies.faculty')}>
            {ar ? me.faculty.nameAr : me.faculty.nameFr}
          </Fact>
        </dl>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('profile.progress.title')}</h2>

        <dl className={`${styles.card} ${styles.facts}`}>
          <Fact label={t('profile.progress.gpa')}>
            {gpa === null ? (
              t('profile.progress.gpa_unpublished')
            ) : (
              <>
                <span className="num">{fmtRatio(gpa.toFixed(2), 20)}</span>
                {mention !== null && (
                  <span className={styles.mention}>
                    {mentionLabelKey === null ? mention : t(mentionLabelKey)}
                  </span>
                )}
              </>
            )}
          </Fact>
          {/*
            "0 / 32" is a result; "nothing published yet" is the absence of one.
            They are the same digits and mean different things, so each line
            says which it is.

            The semester: `gpa` is null exactly when no final result of the
            current semester is published, so its credits are stated as what is
            at stake, not as none earned.
          */}
          <Fact label={t('profile.progress.semester_credits')}>
            {gpa === null ? (
              <Interpolated
                template={t('profile.progress.credits_pending')}
                values={{ total: semesterCredits.total }}
              />
            ) : (
              <span className="num">{fmtRatio(semesterCredits.earned, semesterCredits.total)}</span>
            )}
          </Fact>
          {/*
            The whole course: "no result published" only when that is KNOWN —
            zero earned with results out is a real zero and stays a figure, as
            does the case where the lookup failed and nothing can be claimed.
          */}
          <Fact label={t('profile.progress.total_credits')}>
            {totalCredits.earned === 0 && anyPublished === false ? (
              <Interpolated
                template={t('profile.progress.credits_none')}
                values={{ total: totalCredits.total }}
              />
            ) : (
              <span className="num">{fmtRatio(totalCredits.earned, totalCredits.total)}</span>
            )}
          </Fact>
          <Fact label={t('profile.progress.attendance')}>
            {attendancePercentage === null ? (
              t('profile.progress.none')
            ) : (
              <span className="num">{fmtPercent(attendancePercentage)}</span>
            )}
          </Fact>
        </dl>
      </section>

      <FacultyContact faculty={me.faculty} />
    </>
  );
}

/**
 * The faculty's contact details. Each line is omitted when empty rather than
 * shown blank, and the section goes entirely if all four are — a heading over
 * nothing reads as a failure to load.
 */
function FacultyContact({ faculty }: { faculty: MeResponse['faculty'] }) {
  const { t } = useI18n();

  const email = faculty.email?.trim() ?? '';
  const phone = faculty.phone?.trim() ?? '';
  const address = faculty.address?.trim() ?? '';
  const hours = faculty.hours?.trim() ?? '';

  if (!email && !phone && !address && !hours) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('profile.contact.title')}</h2>

      <dl className={`${styles.card} ${styles.facts}`}>
        {email && (
          <Fact label={t('profile.contact.email')}>
            <a className={styles.link} href={`mailto:${email}`}>
              <bdi>{email}</bdi>
            </a>
          </Fact>
        )}
        {phone && (
          <Fact label={t('profile.contact.phone')}>
            {/* A number, so Latin and left-to-right whatever the page is. */}
            <a className={`${styles.link} num`} href={`tel:${phone.replace(/\s+/g, '')}`} dir="ltr">
              {phone}
            </a>
          </Fact>
        )}
        {address && <Fact label={t('profile.contact.address')}>{address}</Fact>}
        {hours && (
          <Fact label={t('profile.contact.hours')}>
            <bdi>{hours}</bdi>
          </Fact>
        )}
      </dl>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{children}</dd>
    </div>
  );
}

/**
 * The photo when there is one and it loads; the initials otherwise. The same
 * rule as the news images — a failed external image becomes a designed
 * fallback, never a broken-image icon — in a fixed box, so neither case moves
 * the text beside it.
 */
function Avatar({
  photoUrl,
  firstName,
  lastName,
}: {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className={styles.avatar} aria-hidden="true">
      {photoUrl !== null && !failed ? (
        // A plain <img>: an external host, and a fixed-size box around it.
        <img className={styles.avatarImg} src={photoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span className={styles.avatarInitials}>{initials}</span>
      )}
    </div>
  );
}

const STATUS_KEY: Record<string, TranslationKey> = {
  ACTIVE: 'profile.status.active',
  SUSPENDED: 'profile.status.suspended',
  GRADUATED: 'profile.status.graduated',
};

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: styles.statusActive,
  SUSPENDED: styles.statusSuspended,
};

const LEVEL_KEY: Record<string, TranslationKey> = {
  DUT: 'profile.level.dut',
  LICENCE: 'profile.level.licence',
  MASTER: 'profile.level.master',
  DOCTORAT: 'profile.level.doctorat',
};
