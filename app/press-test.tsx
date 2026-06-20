import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressBox } from '@/components/PressBox';

export default function PressTestScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>PressBox Tier Demo</Text>

        <Text style={s.label}>lift — flex:1 row × 3 (stat cards)</Text>
        <View style={s.row}>
          {(['A', 'B', 'C'] as const).map((k) => (
            <PressBox key={k} tier="lift" style={s.flexCard}>
              <Text style={s.boxText}>lift</Text>
            </PressBox>
          ))}
        </View>

        <Text style={s.label}>tint — flex:1 row × 2 (semester segments)</Text>
        <View style={s.row}>
          {(['X', 'Y'] as const).map((k) => (
            <PressBox key={k} tier="tint" style={[s.flexCard, s.tintCard]}>
              <Text style={s.boxText}>tint</Text>
            </PressBox>
          ))}
        </View>

        <Text style={s.label}>settle — full-width card</Text>
        <PressBox tier="settle" style={s.fullCard}>
          <Text style={s.boxText}>settle</Text>
        </PressBox>

        <Text style={s.label}>button — explicit 160×48</Text>
        <PressBox tier="button" style={s.btn}>
          <Text style={s.btnText}>button</Text>
        </PressBox>

        <Text style={s.label}>icon — 38×38 circle</Text>
        <PressBox tier="icon" style={s.icon} radius={19}>
          <Text style={s.iconText}>i</Text>
        </PressBox>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },
  content: {
    padding: 24,
    gap: 8,
    paddingBottom: 64,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C2320',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7B74',
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flexCard: {
    flex: 1,
    backgroundColor: '#E6F7F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  tintCard: {
    backgroundColor: '#B3E4D3',
  },
  fullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  btn: {
    width: 160,
    height: 48,
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  boxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F6E56',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
