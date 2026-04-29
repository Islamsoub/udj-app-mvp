import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import { colors, spacing } from '@/constants/theme';

const HomeIcon = (require('../../assets/icons/home.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const AgendaIcon = (require('../../assets/icons/agenda.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const NotesIcon = (require('../../assets/icons/notes.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const ActusIcon = (require('../../assets/icons/actus.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;
const ProfileIcon = (require('../../assets/icons/profile.svg') as { default: React.FC<{ width: number; height: number; color?: string }> }).default;

export default function TabsLayout() {
  const { t } = useTranslation();
  const isRTL = useSettingsStore((s) => s.isRTL);

  const tabs = [
    { name: 'home', title: t('tabs.home'), Icon: HomeIcon },
    { name: 'schedule', title: t('tabs.schedule'), Icon: AgendaIcon },
    { name: 'grades', title: t('tabs.grades'), Icon: NotesIcon },
    { name: 'news', title: t('tabs.news'), Icon: ActusIcon },
    { name: 'profile', title: t('tabs.profile'), Icon: ProfileIcon },
  ];

  // Mirror tab order for Arabic RTL
  const orderedTabs = isRTL ? [...tabs].reverse() : tabs;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 72,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8ECE9',
          paddingBottom: 12,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#1D9E75',
        tabBarInactiveTintColor: '#9EADA7',
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
                  { color: focused ? '#1D9E75' : '#9EADA7' },
                  focused && styles.tabLabelActive,
                ]}
              >
                {tab.title}
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <tab.Icon width={24} height={24} color={color} />
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
