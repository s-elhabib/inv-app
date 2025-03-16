import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

interface BaseScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function BaseScreen({ children, style }: BaseScreenProps) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors[theme].background },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});