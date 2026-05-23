import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import { useColors } from '@/hooks/useColors';

const HomeIcon = (require('../../assets/icons/home.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const AgendaIcon = (require('../../assets/icons/agenda.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const NotesIcon = (require('../../assets/icons/notes.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const ActusIcon = (require('../../assets/icons/actus.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const ProfileIcon = (require('../../assets/icons/profile.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useColors();

  const tabs = [
    { name: 'home', title: t('tabs.home'), Icon: HomeIcon, iconW: 28, iconH: 28 },
    { name: 'schedule', title: t('tabs.schedule'), Icon: AgendaIcon, iconW: 24, iconH: 24 },
    { name: 'grades', title: t('tabs.grades'), Icon: NotesIcon, iconW: 28, iconH: 28 },
    { name: 'news', title: t('tabs.news'), Icon: ActusIcon, iconW: 24, iconH: 24 },
    { name: 'profile', title: t('tabs.profile'), Icon: ProfileIcon, iconW: 24, iconH: 24 },
  ];

  const orderedTabs = tabs;

  const tabBarStyle = useMemo(() => ({
    height: 72,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 12,
    paddingTop: 6,
  }), [colors]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.jadePrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'PlusJakartaSans',
          fontWeight: '500',
          marginTop: 0,
        },
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
                  { color: focused ? colors.jadePrimary : colors.textSecondary },
                  focused && styles.tabLabelActive,
                ]}
              >
                {tab.title}
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <View style={{ width: tab.iconW, height: tab.iconH, overflow: 'hidden' }}>
                <tab.Icon width={tab.iconW} height={tab.iconH} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
