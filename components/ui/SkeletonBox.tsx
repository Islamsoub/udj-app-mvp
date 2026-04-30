import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { colors } from '@/constants/theme';

interface SkeletonBoxProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({ width, height, borderRadius = 4, style }: SkeletonBoxProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmer]);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.skeletonBase, colors.skeletonHighlight, colors.skeletonBase],
  });

  // backgroundColor is an AnimatedInterpolation; cast via unknown to satisfy TS
  const animatedStyle = { width, height, borderRadius, backgroundColor } as unknown as ViewStyle;

  return <Animated.View style={[animatedStyle, style]} />;
}
