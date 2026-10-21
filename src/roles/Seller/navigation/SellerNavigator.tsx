import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SellerMainScreen from '../screens/SellerMainScreen';
import AddProductScreen from '../features/Product/screens/AddProductScreen';
import ImportExportScreen from '../features/Product/screens/ImportExportScreen';
import CancelledOrdersScreen from '../features/Orders/screens/CancelledOrdersScreen';
import ReturnRequestsScreen from '../features/Orders/screens/ReturnRequestsScreen';
import CreateCampaignScreen from '../features/Ads/screens/CreateCampaignScreen';
import ChatDetailScreen from '../features/Chat/screens/ChatDetailScreen';
import SettingsScreen from '../features/Settings/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function SellerNavigator({ onLogout }) {
  return (
    <Stack.Navigator
      id="Seller"
      initialRouteName="SellerMain"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SellerMain" component={SellerMainScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="ImportExport" component={ImportExportScreen} />
      <Stack.Screen name="CancelledOrders" component={CancelledOrdersScreen} />
      <Stack.Screen name="ReturnRequests" component={ReturnRequestsScreen} />
      <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="Settings">
        {props => (
          <SettingsScreen
            {...props}
            onLogout={onLogout}
            onSelectTab={tab => {
              props.navigation.navigate('SellerMain', { initialTab: tab });
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
