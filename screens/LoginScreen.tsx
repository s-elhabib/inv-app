"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../context/AuthContext"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigation = useNavigation()
  const { login, isLoading: authLoading } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both username and password")
      return
    }

    setIsLoading(true)
    try {
      console.log(`Attempting to login with: ${email}/${password}`);
      const success = await login(email, password)
      console.log(`Login success: ${success}`);
      
      if (!success) {
        Alert.alert("Login Failed", "Invalid username or password")
      }
      // Navigation will be handled in App.tsx based on user role
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  // Fill in demo credentials for quick testing
  const fillAdminCredentials = () => {
    setEmail("admin");
    setPassword("admin");
  }

  const fillClientCredentials = () => {
    setEmail("client");
    setPassword("client123");
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={[styles.logo, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Logo</Text>
        </View>
        <Text style={styles.title}>Restaurant Management</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading || authLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Demo credentials:</Text>
          <TouchableOpacity onPress={fillAdminCredentials}>
            <Text style={[styles.hintText, styles.clickableHint]}>Admin: admin / admin</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={fillClientCredentials}>
            <Text style={[styles.hintText, styles.clickableHint]}>Client: client / client123</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#F47B20",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  hintContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  hintText: {
    color: "#666",
    marginBottom: 5,
  },
  clickableHint: {
    color: "#F47B20",
    textDecorationLine: "underline",
  }
})
