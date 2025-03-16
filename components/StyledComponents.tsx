import { Text, View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Feather';

export function StyledText({ style, ...props }) {
  const { theme } = useTheme();
  return <Text style={[{ color: colors[theme].text }, style]} {...props} />;
}

export function StyledCard({ style, ...props }) {
  const { theme } = useTheme();
  return (
    <View
      style={[{
        backgroundColor: colors[theme].card,
        borderColor: colors[theme].border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        shadowColor: colors[theme].text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }, style]}
      {...props}
    />
  );
}

export function StyledInput({ style, leftIcon, ...props }) {
  const { theme } = useTheme();
  return (
    <View style={styles.inputContainer}>
      {leftIcon && (
        <Icon 
          name={leftIcon} 
          size={20} 
          color={colors[theme].muted}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        style={[{
          flex: 1,
          backgroundColor: colors[theme].input,
          color: colors[theme].inputText,
          borderRadius: 8,
          padding: 12,
          paddingLeft: leftIcon ? 44 : 12,
        }, style]}
        placeholderTextColor={colors[theme].placeholder}
        {...props}
      />
    </View>
  );
}

export function StyledButton({ style, textStyle, title, ...props }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[{
        backgroundColor: colors[theme].primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }, style]}
      {...props}
    >
      <Text style={[{
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
      }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
});
