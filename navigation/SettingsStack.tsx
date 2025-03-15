import { createNativeStackNavigator } from "@react-navigation/native-stack"
import SettingsScreen from "../screens/admin/SettingsScreen"
import ManageClientsScreen from "../screens/admin/ManageClientsScreen"

const Stack = createNativeStackNavigator()

export default function SettingsStack() {
  return (
    <Stack.Navigator initialRouteName="SettingsMain">
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ManageClients" 
        component={ManageClientsScreen}
        options={{ 
          title: "Manage Clients",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#F47B20",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </Stack.Navigator>
  )
}