"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { View, Text, StyleSheet } from "react-native"
import { Home, BarChart2, ShoppingBag } from "lucide-react-native"
import HomeScreen from "../screens/client/HomeScreen"
import AnalysisScreen from "../screens/client/AnalysisScreen"
import StoreScreen from "../screens/client/StoreScreen"
import { useAuth } from "../context/AuthContext"

const Tab = createBottomTabNavigator()

export default function ClientNavigator() {
  const { user } = useAuth()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#F47B20",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: {
          backgroundColor: "#fff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.restaurantName}>{user?.name} 👋</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
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

