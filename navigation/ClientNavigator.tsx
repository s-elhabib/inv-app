"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { View, Text, StyleSheet } from "react-native"
import { Home, BarChart2, ShoppingBag } from "lucide-react-native"
import HomeScreen from "../screens/client/HomeScreen"
import AnalysisScreen from "../screens/client/AnalysisScreen"
import StoreScreen from "../screens/client/StoreScreen"
import { useAuth } from "../context/AuthContext"
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator()

export default function ClientNavigator() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors[theme].card,
        },
        headerTintColor: colors[theme].text,
        headerTitleStyle: {
          color: colors[theme].text,
        },
        contentStyle: {
          backgroundColor: colors[theme].background,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.restaurantName}>{user?.name} 👋</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          headerTitle: "Analysis",
        }}
      />
      <Stack.Screen
        name="Store"
        component={StoreScreen}
        options={{
          headerTitle: "Store",
        }}
      />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "flex-start",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
})

