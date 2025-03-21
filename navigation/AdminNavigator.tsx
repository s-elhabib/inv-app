import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, BarChart2, ShoppingBag, Settings, Users, FileText } from "lucide-react-native"
import DashboardScreen from "../screens/admin/DashboardScreen"
import AnalyticsScreen from "../screens/admin/AnalyticsScreen"
import InventoryScreen from "../screens/admin/InventoryScreen"
import SettingsStack from "./SettingsStack"
import ClientProductSelectionScreen from "../screens/client/ClientProductSelectionScreen"
import ClientOrderHistoryScreen from "../screens/admin/ClientOrderHistoryScreen"

const Tab = createBottomTabNavigator()

export default function AdminNavigator() {
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
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="ClientProductSelection" 
        component={ClientProductSelectionScreen}
        options={({ route }) => ({ 
          title: `Select Products for ${route.params?.clientName || 'Client'}`,
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#F47B20",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          tabBarLabel: "Client Orders"
        })}
      />
      <Tab.Screen 
        name="ClientOrderHistory" 
        component={ClientOrderHistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          tabBarLabel: "Client Orders",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#F47B20",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </Tab.Navigator>
  )
}

