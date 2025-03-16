import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors[theme].card,
          borderTopColor: colors[theme].border,
        },
        tabBarActiveTintColor: colors[theme].primary,
        tabBarInactiveTintColor: colors[theme].muted,
        headerStyle: {
          backgroundColor: colors[theme].card,
        },
        headerTintColor: colors[theme].text,
      }}
    >
      {/* Your tab screens here */}
    </Tab.Navigator>
  );
}