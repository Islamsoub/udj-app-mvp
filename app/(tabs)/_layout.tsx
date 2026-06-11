import React from 'react';
import { View, Pressable, StyleSheet, I18nManager } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { radius, elevation, spacing, withAlpha } from '@/constants/theme';
import TabHome from '@/assets/icons/tab-home.svg';
import TabAgenda from '@/assets/icons/tab-agenda.svg';
import TabNotes from '@/assets/icons/tab-notes.svg';
import TabActus from '@/assets/icons/tab-actus.svg';
import TabProfile from '@/assets/icons/tab-profile.svg';

type TabName = 'home' | 'schedule' | 'grades' | 'news' | 'profile';

const SVG_CONFIG: Record<TabName, React.FC<SvgProps>> = {
  home:     TabHome,
  schedule: TabAgenda,
  grades:   TabNotes,
  news:     TabActus,
  profile:  TabProfile,
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useColors();

  const shadowStyle = isDark
    ? {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.hair,
      }
    : elevation.navFloat;

  return (
    <View
      style={[
        styles.bar,
        {
          bottom: spacing.sp14 + insets.bottom,
          backgroundColor: colors.surface,
        },
        shadowStyle,
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = SVG_CONFIG[route.name as TabName];
        if (!config) return null;

        const Component = config;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.cell}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <View
              style={[
                styles.pill,
                isFocused && { backgroundColor: colors.jade400 },
              ]}
            >
              <Component
                width={24}
                height={24}
                color={isFocused ? '#FFFFFF' : colors.textSecondary}
              />
              {/* 4px dot — invisible spacer when inactive, keeps icon vertically centered */}
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isFocused
                      ? withAlpha('#FFFFFF', 0.9) // on-jade white dot
                      : 'transparent',
                  },
                ]}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="grades" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.sp14,
    right: spacing.sp14,
    height: 60,
    borderRadius: radius.rHero, // 22
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  pill: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: radius.rFull,
  },
});
