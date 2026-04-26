import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import { colors, spacing } from '@/constants/theme';

interface TabIconProps {
  label: string;
  focused: boolean;
}

function TabIcon({ label, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.iconText, focused && styles.iconTextActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const isRTL = useSettingsStore((s) => s.isRTL);

  const tabs = [
    { name: 'home', title: t('tabs.home'), icon: '⌂' },
    { name: 'schedule', title: t('tabs.schedule'), icon: '📅' },
    { name: 'grades', title: t('tabs.grades'), icon: '🎓' },
    { name: 'news', title: t('tabs.news'), icon: '📰' },
    { name: 'profile', title: t('tabs.profile'), icon: '👤' },
  ];

  // Mirror tab order for Arabic RTL
  const orderedTabs = isRTL ? [...tabs].reverse() : tabs;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.jade400,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {orderedTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: ({ focused }) => (
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? colors.jade400 : colors.textTertiary },
                  focused && styles.tabLabelActive,
                ]}
              >
                {tab.title}
              </Text>
            ),
            tabBarIcon: ({ focused }) => (
              <TabIcon label={tab.icon} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 56,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 0,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.jade50,
  },
  iconText: {
    fontSize: 18,
  },
  iconTextActive: {
    // tint handled by tabBarActiveTintColor
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
