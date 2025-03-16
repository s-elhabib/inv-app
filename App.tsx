import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar, ActivityIndicator, View } from "react-native"
import LoginScreen from "./screens/LoginScreen"
import ClientNavigator from "./navigation/ClientNavigator"
import AdminNavigator from "./navigation/AdminNavigator"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider, useTheme } from "./context/ThemeContext"
import { colors } from "./theme/colors"

const Stack = createNativeStackNavigator()

function AppNavigator() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { theme } = useTheme()
  
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors[theme].background 
      }}>
        <ActivityIndicator size="large" color={colors[theme].primary} />
      </View>
    )
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors[theme].background }
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user?.role === "admin" ? (
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="ClientApp" component={ClientNavigator} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

function AppContent() {
  const { theme } = useTheme()
  
  return (
    <>
      <StatusBar 
        barStyle={theme === 'dark' ? "light-content" : "dark-content"} 
        backgroundColor={colors[theme].background} 
      />
      <AuthProvider>
        <NavigationContainer
          theme={theme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </>
  )
}

