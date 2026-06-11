import React from 'react';
import { View, Pressable, StyleSheet, I18nManager } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { radius, elevation, spacing, withAlpha } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { inactive: IoniconName; active: IoniconName }> = {
  home:     { inactive: 'home-outline',      active: 'home' },
  schedule: { inactive: 'calendar-outline',  active: 'calendar' },
  grades:   { inactive: 'reader-outline',    active: 'reader' },
  news:     { inactive: 'newspaper-outline', active: 'newspaper' },
  profile:  { inactive: 'person-outline',    active: 'person' },
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
    : elevation.navFloat; // navShadow

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
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

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
              <Ionicons
                name={isFocused ? config.active : config.inactive}
                size={22}
                // on-jade white for active; textSecondary for inactive
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
