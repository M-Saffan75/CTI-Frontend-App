import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/Home/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function SellerNavigator() {
  return (
    <Stack.Navigator id="Seller" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
