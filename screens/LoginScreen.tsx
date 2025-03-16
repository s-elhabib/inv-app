import React, { useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { BaseScreen } from '../components/BaseScreen';
import { 
  StyledText, 
  StyledCard, 
  StyledButton, 
  StyledInput 
} from '../components/StyledComponents';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { theme } = useTheme();

  return (
    <BaseScreen>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          {/* <Image 
            source={require('../assets/logo.png')} // Make sure to add your logo
            style={styles.logo}
            resizeMode="contain"
          /> */}
          <StyledText style={styles.welcomeText}>Welcome Back</StyledText>
          <StyledText style={styles.subtitleText}>
            Sign in to continue to your account
          </StyledText>
        </View>

        <StyledCard style={styles.card}>
          <StyledInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            leftIcon="mail" // If you're using icons
          />
          
          <StyledInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            leftIcon="lock" // If you're using icons
          />
          
          <StyledButton
            title="Sign In"
            onPress={() => login(email, password)}
            style={styles.button}
          />

          <View style={styles.forgotPasswordContainer}>
            <StyledText 
              style={[styles.forgotPasswordText, { color: colors[theme].primary }]}
              onPress={() => {/* Handle forgot password */}}
            >
              Forgot Password?
            </StyledText>
          </View>
        </StyledCard>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    borderRadius: 15,
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    height: 50,
    borderRadius: 25,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
});
