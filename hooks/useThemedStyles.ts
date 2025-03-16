import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (colors: typeof colors.light) => T
) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  
  return StyleSheet.create(styleFactory(themeColors));
}