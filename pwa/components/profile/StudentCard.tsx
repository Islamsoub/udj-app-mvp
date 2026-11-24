'use client';

import { useState } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import { mentionKey } from '@/components/grades/model';
import { useOnline } from '@/components/shell/useOnline';
import type { MeResponse } from '@/lib/api-types';
import { fmtPercent, fmtRatio } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { initialsOf, levelKeyFor } from '@/lib/student';
import {
  CalendarIcon,
  CapIcon,
  ChartIcon,
  ClockIcon,
  DocumentIcon,
  FlagIcon,
  InfoIcon,
  LayersIcon,
  MailIcon,
  PersonIcon,
  PhoneIcon,
  PinIcon,
} from './icons';
import { TileGroup, TileList, TileRow } from './tiles';
import styles from './profile.module.css';

const ICON = styles.tileGlyph;

/**
 * The prototype's .identity-block, centred: the avatar, the name, the
 * matricule in mono, a pill with the REAL connection state, and one line
 * "Filière · Faculté · Semestre n" from the account.
 *
 * Read-only, like everything GET /student/me says: there is no endpoint that
 * edits any of it; changes go through the scolarité.
 */
export function Identity({ me }: { me: MeResponse }) {
  const { t, lang } = useI18n();
  const { online } = useOnline();
  const ar = lang === 'ar';

  return (
    <section className={styles.identity} aria-label={`${me.firstName} ${me.lastName}`}>
      <Avatar photoUrl={me.photoUrl} firstName={me.firstName} lastName={me.lastName} />
      <h2 className={styles.name}>
        {me.firstName} {me.lastName}
      </h2>
      {/* DM Mono via `.mono`, in both languages: an identifier the student reads
          out at a counter, so it must look the same always. */}
      <p className={`${styles.studentId} mono`}>
        <bdi>{me.studentIdDisplay}</bdi>
      </p>

      {/* The connection, from the shell's own online state: a jade dot when
          the device is online, a neutral one when it is not. In words too. */}
      <p className={`${styles.statusPill} ${online ? styles.statusOnline : styles.statusOffline}`}>
        <span className={styles.statusDot} aria-hidden="true" />
        {t(online ? 'profile.identity.online' : 'profile.identity.offline')}
      </p>

      <p className={styles.identityLine}>
        <Interpolated
          template={t('profile.identity.line')}
          values={{
            programme: ar ? me.programme.nameAr : me.programme.nameFr,
            faculty: ar ? me.faculty.nameAr : me.faculty.nameFr,
            semester: me.currentSemester,
          }}
          // The two names are words in the page's language; only the semester
          // number goes on the Latin face.
          renderValue={(name, value) =>
            name === 'semester' ? <span key={name} className="num">{value}</span> : <bdi key={name}>{value}</bdi>
          }
        />
      </p>
    </section>
  );
}

/**
 * "Informations", "Parcours" and "Contacter ma faculté" as the prototype's
 * .tile-group, full width. The first is Design's; the other two are the PWA's
 * own and kept (design-known-divergences.md).
 */
export function AccountGroups({
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
      <TileGroup title={t('profile.info.title')}>
        <TileList>
          <TileRow icon={<PersonIcon className={ICON} />} tone="jade" label={t('profile.studies.programme')}>
            {ar ? me.programme.nameAr : me.programme.nameFr}
            <span className={`${styles.code} num`}>{me.programme.code}</span>
          </TileRow>
          <TileRow icon={<CapIcon className={ICON} />} tone="jade" label={t('profile.studies.level')}>
            {t(levelKeyFor(me.programme.level) ?? 'profile.level.unknown')}
          </TileRow>
          <TileRow icon={<CalendarIcon className={ICON} />} tone="warning" label={t('profile.studies.semester')}>
            <Interpolated
              template={t('profile.studies.semester_value')}
              values={{ current: me.currentSemester, total: me.programme.durationSemesters }}
            />
          </TileRow>
          <TileRow icon={<InfoIcon className={ICON} />} tone="info" label={t('profile.studies.faculty')}>
            {ar ? me.faculty.nameAr : me.faculty.nameFr}
          </TileRow>
          <TileRow icon={<MailIcon className={ICON} />} tone="exam" label={t('profile.info.email')}>
            {/* An address, so its direction is its own, not the page's. */}
            <bdi className="mono">{me.email}</bdi>
          </TileRow>
          {/* The enrolment status, only when it is not the ordinary one: a
              suspended or graduated account must still say so, now that the
              identity pill shows the connection instead. */}
          {me.status !== 'ACTIVE' && (
            <TileRow icon={<FlagIcon className={ICON} />} tone="danger" label={t('profile.info.status')}>
              {t(STATUS_KEY[me.status] ?? 'profile.status.unknown')}
            </TileRow>
          )}
        </TileList>
      </TileGroup>

      <TileGroup title={t('profile.progress.title')}>
        <TileList>
          <TileRow icon={<ChartIcon className={ICON} />} tone="jade" label={t('profile.progress.gpa')}>
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
          </TileRow>
          {/*
            "0 / 32" is a result; "nothing published yet" is the absence of one.
            `gpa` is null exactly when no final result of the current semester
            is published, so its credits are then stated as what is at stake.
          */}
          <TileRow icon={<DocumentIcon className={ICON} />} tone="info" label={t('profile.progress.semester_credits')}>
            {gpa === null ? (
              <Interpolated
                template={t('profile.progress.credits_pending')}
                values={{ total: semesterCredits.total }}
              />
            ) : (
              <span className="num">{fmtRatio(semesterCredits.earned, semesterCredits.total)}</span>
            )}
          </TileRow>
          {/* "No result published" only when that is KNOWN: zero earned with
              results out is a real zero and stays a figure. */}
          <TileRow icon={<LayersIcon className={ICON} />} tone="exam" label={t('profile.progress.total_credits')}>
            {totalCredits.earned === 0 && anyPublished === false ? (
              <Interpolated
                template={t('profile.progress.credits_none')}
                values={{ total: totalCredits.total }}
              />
            ) : (
              <span className="num">{fmtRatio(totalCredits.earned, totalCredits.total)}</span>
            )}
          </TileRow>
          <TileRow icon={<ClockIcon className={ICON} />} tone="warning" label={t('profile.progress.attendance')}>
            {attendancePercentage === null ? (
              t('profile.progress.none')
            ) : (
              <span className="num">{fmtPercent(attendancePercentage)}</span>
            )}
          </TileRow>
        </TileList>
      </TileGroup>

      <FacultyContact faculty={me.faculty} />
    </>
  );
}

/**
 * The faculty's contact details. Each line is omitted when empty rather than
 * shown blank, and the group goes entirely if all four are — a heading over
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
    <TileGroup title={t('profile.contact.title')}>
      <TileList>
        {email && (
          <TileRow icon={<MailIcon className={ICON} />} tone="exam" label={t('profile.contact.email')}>
            <a className={styles.link} href={`mailto:${email}`}>
              <bdi>{email}</bdi>
            </a>
          </TileRow>
        )}
        {phone && (
          <TileRow icon={<PhoneIcon className={ICON} />} tone="jade" label={t('profile.contact.phone')}>
            {/* A number, so Latin and left-to-right whatever the page is. */}
            <a className={`${styles.link} num`} href={`tel:${phone.replace(/\s+/g, '')}`} dir="ltr">
              {phone}
            </a>
          </TileRow>
        )}
        {address && (
          <TileRow icon={<PinIcon className={ICON} />} tone="info" label={t('profile.contact.address')}>
            {address}
          </TileRow>
        )}
        {hours && (
          <TileRow icon={<ClockIcon className={ICON} />} tone="warning" label={t('profile.contact.hours')}>
            <bdi>{hours}</bdi>
          </TileRow>
        )}
      </TileList>
    </TileGroup>
  );
}

/**
 * The photo when there is one and it loads; the initials otherwise. A failed
 * external image becomes the designed fallback, never a broken-image icon, in a
 * fixed box, so neither case moves what is under it.
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
  const initials = initialsOf(firstName, lastName);

  return (
    <div className={styles.avatar} aria-hidden="true">
      {photoUrl !== null && !failed ? (
        // A plain <img>: an external host, and a fixed-size box around it.
        <img className={styles.avatarImg} src={photoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <bdi className={styles.avatarInitials}>{initials}</bdi>
      )}
    </div>
  );
}

const STATUS_KEY: Record<string, TranslationKey> = {
  ACTIVE: 'profile.status.active',
  SUSPENDED: 'profile.status.suspended',
  GRADUATED: 'profile.status.graduated',
};
