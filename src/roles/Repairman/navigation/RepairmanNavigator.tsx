import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/Home/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function RepairmanNavigator() {
  return (
    <Stack.Navigator id="Repairman" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
