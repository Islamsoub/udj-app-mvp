import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

export type ProfileHeaderState =
  | 'skeleton'
  | 'loaded'
  | 'offline'
  | 'incomplete'
  | 'error'
  | 'session';

export interface ProfileHeaderStudent {
  name: string;
  id: string;
  filiere: string;
  gpa: number;
  credits: number;
  presence: number;
}

interface ProfileHeaderProps {
  state: ProfileHeaderState;
  topInset: number;
  student?: ProfileHeaderStudent;
}

// Spec-derived heights (content area, topInset added at render)
const HEADER_STRIP_H = 93;
const WHITE_AREA_H = 305;
const OFFLINE_WHITE_H = 280; // 275 spec + 5px so tiles don't clip
const OFFLINE_BANNER_H = 46;

// Y positions within white area content (measured from white-area top)
const AVATAR_Y_LOADED = 121;
const AVATAR_Y_OFFLINE = 99;
const STATS_Y = 216;

// ── Header strip inner ────────────────────────────────────────────────────────

function HeaderStrip({
  topInset,
  t,
}: {
  topInset: number;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <View style={[styles.headerStrip, { height: HEADER_STRIP_H + topInset }]}>
      <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      <Pressable style={styles.dotsButton} hitSlop={8}>
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.greyMedium} />
      </Pressable>
    </View>
  );
}

// ── Offline banner (replaces header strip) ────────────────────────────────────

function OfflineBannerStrip({
  topInset,
  t,
}: {
  topInset: number;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <View
      style={[
        styles.offlineBanner,
        { height: OFFLINE_BANNER_H + topInset, paddingTop: topInset },
      ]}
    >
      <View style={styles.offlineDot} />
      <Text style={styles.offlineBannerText} numberOfLines={1}>
        {t('profile.offline.banner')}
      </Text>
      <Text style={styles.offlineTimestamp}>{t('profile.offline.timestamp')}</Text>
    </View>
  );
}

// ── Stat tiles ─────────────────────────────────────────────────────────────────

function StatTiles({
  student,
  isSkeleton,
  topPos,
  t,
}: {
  student: ProfileHeaderStudent;
  isSkeleton: boolean;
  topPos: number;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <View
      style={[
        styles.tilesRow,
        { position: 'absolute', top: topPos, start: spacing.sp16, end: spacing.sp16 },
      ]}
    >
      {isSkeleton ? (
        <>
          <View style={{ flex: 1 }}>
            <SkeletonBox width="100%" height={62} borderRadius={radius.rLg} />
          </View>
          <View style={{ flex: 1 }}>
            <SkeletonBox width="100%" height={62} borderRadius={radius.rLg} />
          </View>
          <View style={{ flex: 1 }}>
            <SkeletonBox width="100%" height={62} borderRadius={radius.rLg} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('profile.gpa')}</Text>
            <Text style={[styles.tileValue, styles.tileValueMono]}>
              {student.gpa.toFixed(1)}
            </Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('profile.credits')}</Text>
            <Text style={styles.tileValue}>{student.credits}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('profile.presence')}</Text>
            <Text style={styles.tileValue}>{student.presence}%</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ── Profile info block (avatar + name / ID / filière) ─────────────────────────

function ProfileInfoBlock({
  student,
  isSkeleton,
  avatarTop,
}: {
  student: ProfileHeaderStudent;
  isSkeleton: boolean;
  avatarTop: number;
}) {
  return (
    <>
      {/* Avatar circle */}
      <View
        style={[
          styles.avatar,
          { position: 'absolute', top: avatarTop, start: spacing.sp16 },
        ]}
      />

      {isSkeleton ? (
        <>
          <SkeletonBox
            width={157}
            height={18}
            borderRadius={8}
            style={{ position: 'absolute', top: avatarTop, start: 103 }}
          />
          <SkeletonBox
            width={120}
            height={14}
            borderRadius={8}
            style={{ position: 'absolute', top: avatarTop + 25, start: 103 }}
          />
          <SkeletonBox
            width={140}
            height={12}
            borderRadius={8}
            style={{ position: 'absolute', top: avatarTop + 45, start: 103 }}
          />
        </>
      ) : (
        <>
          <Text
            style={[styles.profileName, { position: 'absolute', top: avatarTop, start: 103, end: spacing.sp16 }]}
            numberOfLines={1}
          >
            {student.name}
          </Text>
          <Text
            style={[
              styles.profileStudentId,
              { position: 'absolute', top: avatarTop + 25, start: 103, end: spacing.sp16 },
            ]}
            numberOfLines={1}
          >
            {student.id}
          </Text>
          <Text
            style={[
              styles.profileFiliere,
              { position: 'absolute', top: avatarTop + 45, start: 103, end: spacing.sp16 },
            ]}
            numberOfLines={1}
          >
            {student.filiere}
          </Text>
        </>
      )}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProfileHeader({ state, topInset, student }: ProfileHeaderProps) {
  const { t } = useTranslation();

  // ── Offline: banner above white area, no header strip ──────────────────────
  if (state === 'offline') {
    return (
      <>
        <OfflineBannerStrip topInset={topInset} t={t} />
        <View
          style={[
            styles.whiteArea,
            styles.whiteAreaBorder,
            { height: OFFLINE_WHITE_H },
          ]}
        >
          {student && (
            <>
              <ProfileInfoBlock
                student={student}
                isSkeleton={false}
                avatarTop={AVATAR_Y_OFFLINE}
              />
              <StatTiles
                student={student}
                isSkeleton={false}
                topPos={STATS_Y}
                t={t}
              />
            </>
          )}
        </View>
      </>
    );
  }

  // ── Error / Incomplete: header strip only ──────────────────────────────────
  if (state === 'error' || state === 'incomplete') {
    return (
      <View style={[styles.whiteArea, { height: HEADER_STRIP_H + topInset }]}>
        <HeaderStrip topInset={topInset} t={t} />
      </View>
    );
  }

  // ── Loaded / Session / Skeleton: full white area ───────────────────────────
  const isSkeleton = state === 'skeleton';
  const totalH = WHITE_AREA_H + topInset;
  const avatarTop = topInset + AVATAR_Y_LOADED;
  const statsTop = topInset + STATS_Y;

  return (
    <View style={[styles.whiteArea, styles.whiteAreaBorder, { height: totalH }]}>
      <HeaderStrip topInset={topInset} t={t} />

      {student && (
        <>
          <ProfileInfoBlock
            student={student}
            isSkeleton={isSkeleton}
            avatarTop={avatarTop}
          />
          <StatTiles
            student={student}
            isSkeleton={isSkeleton}
            topPos={statsTop}
            t={t}
          />
        </>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // White area container
  whiteArea: {
    backgroundColor: colors.surface,
  },
  whiteAreaBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.scheduleBorder,
  },

  // Header strip
  headerStrip: {
    borderBottomWidth: 1,
    borderBottomColor: colors.newsHeaderBorder,
  },
  headerTitle: {
    position: 'absolute',
    bottom: 14,
    start: spacing.sp16,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  dotsButton: {
    position: 'absolute',
    bottom: 8,
    end: spacing.sp16,
    width: 34,
    height: 34,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Offline banner
  offlineBanner: {
    backgroundColor: colors.newsOfflineBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    gap: spacing.sp8,
  },
  offlineDot: {
    width: 11,
    height: 11,
    borderRadius: radius.rFull,
    backgroundColor: colors.offline,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.danger,
  },
  offlineTimestamp: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.danger,
  },

  // Avatar placeholder
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.scheduleBorder,
  },

  // Profile text
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  profileStudentId: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.mono,
    color: colors.greyMedium,
  },
  profileFiliere: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.jade600,
  },

  // Stat tiles row
  tilesRow: {
    height: 62,
    flexDirection: 'row',
    gap: 14,
  },
  tile: {
    flex: 1,
    height: 62,
    borderRadius: radius.rLg,
    backgroundColor: colors.scheduleBorder,
    alignItems: 'center',
    paddingTop: 13,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    marginTop: 2,
    includeFontPadding: false,
  },
  tileValueMono: {
    fontFamily: fonts.mono,
  },
});
