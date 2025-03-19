import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrdersListScreen from "../screens/admin/OrdersListScreen";
import OrderDetailsScreen from "../screens/admin/OrderDetailsScreen";

const Stack = createNativeStackNavigator();

const OrdersStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersListScreen}
        options={{ 
          title: 'Orders',
          headerShown: true,
          headerLeft: () => null // This removes the back button from OrdersList
        }}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen}
        options={{ 
          title: 'Order Details',
          headerShown: true
        }}
      />
    </Stack.Navigator>
  );
};

export default OrdersStack;

