import React, { useCallback, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  AccessibilityRole,
  AccessibilityState,
  Insets,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressBoxTier = 'lift' | 'settle' | 'button' | 'icon' | 'tint';

interface TierCfg {
  scale: number;
  overlay: number;
}

const TIER: Record<PressBoxTier, TierCfg> = {
  lift:   { scale: 1.02,  overlay: 0    },
  settle: { scale: 0.98,  overlay: 0    },
  button: { scale: 0.965, overlay: 0.06 },
  icon:   { scale: 0.90,  overlay: 0.06 },
  tint:   { scale: 1.0,   overlay: 0.04 },
};

interface ShadowCfg {
  initOpacity: number;
  initRadius: number;
  pressOpacity: number;
  pressRadius: number;
}

const SHADOW: Partial<Record<PressBoxTier, ShadowCfg>> = {
  lift:   { initOpacity: 0.05, initRadius: 10, pressOpacity: 0.12, pressRadius: 18 },
  settle: { initOpacity: 0.05, initRadius: 8,  pressOpacity: 0.02, pressRadius: 3  },
  button: { initOpacity: 0.05, initRadius: 8,  pressOpacity: 0.02, pressRadius: 3  },
};

const SPRING_CFG = { damping: 15, stiffness: 200, mass: 0.7 };
const IN_DUR = 110;
const TINT_IN = 70;
const TINT_OUT = 240;

export interface PressBoxProps {
  tier?: PressBoxTier;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  disabled?: boolean;
  hitSlop?: number | Insets;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  children?: React.ReactNode;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
}

export function PressBox({
  tier = 'button',
  style,
  radius: radiusProp,
  disabled,
  hitSlop,
  onPress,
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  onLongPress,
  children,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
}: PressBoxProps) {
  const { colors } = useColors();
  const cfg = TIER[tier];
  const shadowCfg = SHADOW[tier];

  // Reduce motion — shared value for UI-thread worklets, ref for JS callbacks
  const reduceMotionSV = useSharedValue(0); // 0=false, 1=true
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
      reduceMotionSV.value = enabled ? 1 : 0;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      reduceMotionRef.current = enabled;
      reduceMotionSV.value = enabled ? 1 : 0;
    });
    return () => sub.remove();
  }, []);

  const scaleSV = useSharedValue(1);
  const overlaySV = useSharedValue(0);
  const shadowOpacitySV = useSharedValue(shadowCfg?.initOpacity ?? 0);
  const shadowRadiusSV = useSharedValue(shadowCfg?.initRadius ?? 0);

  // Primitives captured into worklet closure — safe for UI thread
  const hasShadow = shadowCfg !== undefined;
  const initShadowOpacity = shadowCfg?.initOpacity ?? 0;
  const initShadowRadius = shadowCfg?.initRadius ?? 0;

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    const rm = reduceMotionRef.current;

    if ((tier === 'lift' || tier === 'settle') && !rm) {
      Haptics.selectionAsync();
    }

    if (rm) {
      overlaySV.value = withTiming(0.04, { duration: IN_DUR });
      return;
    }

    scaleSV.value = withTiming(cfg.scale, {
      duration: IN_DUR,
      easing: Easing.out(Easing.quad),
    });

    if (shadowCfg) {
      shadowOpacitySV.value = withTiming(shadowCfg.pressOpacity, { duration: IN_DUR });
      shadowRadiusSV.value = withTiming(shadowCfg.pressRadius, { duration: IN_DUR });
    }

    if (cfg.overlay > 0) {
      overlaySV.value = withTiming(cfg.overlay, {
        duration: tier === 'tint' ? TINT_IN : IN_DUR,
      });
    }

    onPressInProp?.();
  }, [disabled, tier, cfg, shadowCfg, onPressInProp]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    const rm = reduceMotionRef.current;

    if (rm) {
      overlaySV.value = withTiming(0, { duration: IN_DUR });
      return;
    }

    scaleSV.value = withSpring(1, SPRING_CFG);

    if (shadowCfg) {
      shadowOpacitySV.value = withSpring(shadowCfg.initOpacity, SPRING_CFG);
      shadowRadiusSV.value = withSpring(shadowCfg.initRadius, SPRING_CFG);
    }

    if (cfg.overlay > 0) {
      overlaySV.value = withTiming(0, {
        duration: tier === 'tint' ? TINT_OUT : IN_DUR,
      });
    }

    onPressOutProp?.();
  }, [disabled, tier, cfg, shadowCfg, onPressOutProp]);

  const flat = StyleSheet.flatten(style);
  const overlayRadius =
    radiusProp ??
    (flat && typeof flat.borderRadius === 'number' ? flat.borderRadius : 0);

  const animatedStyle = useAnimatedStyle(() => {
    const rm = reduceMotionSV.value === 1;
    const scale = rm ? 1 : scaleSV.value;

    if (hasShadow) {
      return {
        transform: [{ scale }],
        shadowOpacity: rm ? initShadowOpacity : shadowOpacitySV.value,
        shadowRadius: rm ? initShadowRadius : shadowRadiusSV.value,
      };
    }

    return { transform: [{ scale }] };
  });

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlaySV.value,
  }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      android_ripple={null}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: overlayRadius, backgroundColor: colors.pressWash },
          overlayAnimStyle,
        ]}
      />
    </AnimatedPressable>
  );
}
