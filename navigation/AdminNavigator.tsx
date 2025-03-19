import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, ShoppingBag, Settings, Users, FileText } from "lucide-react-native"
import DashboardScreen from "../screens/admin/DashboardScreen"
import InventoryScreen from "../screens/admin/InventoryScreen"
import SettingsStack from "./SettingsStack"
import ClientProductSelectionScreen from "../screens/client/ClientProductSelectionScreen"
import ClientOrderHistoryScreen from "../screens/admin/ClientOrderHistoryScreen"

const Tab = createBottomTabNavigator()

export default function AdminNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
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
          tabBarLabel: "New Order"
        })}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="ClientOrderHistory" 
        component={ClientOrderHistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          tabBarLabel: "Orders History",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#F47B20",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}

