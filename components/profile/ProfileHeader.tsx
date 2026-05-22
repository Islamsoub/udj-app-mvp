import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
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
  onDotsPress?: () => void;
}

// Spec-derived heights (content area, topInset added via paddingTop at render)
const HEADER_STRIP_H = 93;
const OFFLINE_BANNER_H = 46;

// Y positions within white area (measured from white-area top, after paddingTop)
const AVATAR_Y_LOADED = 121;

// ── Header strip inner ────────────────────────────────────────────────────────

function HeaderStrip({
  t,
  onDotsPress,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  onDotsPress?: () => void;
}) {
  return (
    <View style={styles.headerStrip}>
      <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      <Pressable style={({ pressed }) => [styles.dotsButton, pressed && { backgroundColor: colors.greyMedium + '26', borderRadius: 999 }]} hitSlop={8} onPress={onDotsPress}>
        <Ionicons name="settings-outline" size={18} color={colors.greyMedium} />
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
  t,
}: {
  student: ProfileHeaderStudent;
  isSkeleton: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <View style={styles.tilesRow}>
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
  style,
}: {
  student: ProfileHeaderStudent;
  isSkeleton: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.infoBlock, style]}>
      <View style={styles.avatar} />
      <View style={styles.infoText}>
        {isSkeleton ? (
          <>
            <SkeletonBox width={157} height={18} borderRadius={8} />
            <SkeletonBox width={120} height={14} borderRadius={8} />
            <SkeletonBox width={140} height={12} borderRadius={8} />
          </>
        ) : (
          <>
            <Text style={styles.profileName} numberOfLines={1}>
              {student.name}
            </Text>
            <Text style={styles.profileStudentId} numberOfLines={1}>
              {student.id}
            </Text>
            <Text style={styles.profileFiliere} numberOfLines={1}>
              {student.filiere}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProfileHeader({ state, topInset, student, onDotsPress }: ProfileHeaderProps) {
  const { t } = useTranslation();

  // ── Offline: banner above white area, no header strip ──────────────────────
  if (state === 'offline') {
    return (
      <>
        <OfflineBannerStrip topInset={topInset} t={t} />
        <View style={[styles.whiteArea, styles.whiteAreaBorder, { paddingBottom: spacing.sp16 }]}>
          {student && (
            <>
              <ProfileInfoBlock
                student={student}
                isSkeleton={false}
                style={{ marginTop: spacing.sp32 }}
              />
              <StatTiles student={student} isSkeleton={false} t={t} />
            </>
          )}
        </View>
      </>
    );
  }

  // ── Error / Incomplete: header strip only ──────────────────────────────────
  if (state === 'error' || state === 'incomplete') {
    return (
      <View style={[styles.whiteArea, { height: HEADER_STRIP_H + topInset, paddingTop: topInset }]}>
        <HeaderStrip t={t} onDotsPress={onDotsPress} />
      </View>
    );
  }

  // ── Loaded / Session / Skeleton: full white area ───────────────────────────
  const isSkeleton = state === 'skeleton';

  return (
    <View
      style={[
        styles.whiteArea,
        styles.whiteAreaBorder,
        { paddingTop: topInset, paddingBottom: spacing.sp16 },
      ]}
    >
      <HeaderStrip t={t} onDotsPress={onDotsPress} />
      {student && (
        <>
          <ProfileInfoBlock
            student={student}
            isSkeleton={isSkeleton}
            style={{ marginTop: AVATAR_Y_LOADED - HEADER_STRIP_H }}
          />
          <StatTiles student={student} isSkeleton={isSkeleton} t={t} />
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
    flexDirection: 'column',
  },
  whiteAreaBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.scheduleBorder,
  },

  // Header strip
  headerStrip: {
    height: HEADER_STRIP_H,
    borderBottomWidth: 1,
    borderBottomColor: colors.newsHeaderBorder,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  dotsButton: {
    width: 34,
    height: 34,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
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

  // Profile info block (flex row: avatar left, text column right)
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sp16,
  },

  // Avatar placeholder
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.scheduleBorder,
    flexShrink: 0,
  },

  // Text column
  infoText: {
    flex: 1,
    marginStart: spacing.sp16,
    gap: spacing.sp6,
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
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp16,
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
