import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SellerTabs from './SellerTabs';
import SellerOrderDetailScreen from '../features/Orders/screens/SellerOrderDetailScreen';
import SellerQueryDetailScreen from '../features/Enquiries/screens/SellerQueryDetailScreen';
import AddProductScreen from '../features/Product/screens/AddProductScreen';
import ImportExportScreen from '../features/Product/screens/ImportExportScreen';
import CancelledOrdersScreen from '../features/Orders/screens/CancelledOrdersScreen';
import ReturnRequestsScreen from '../features/Orders/screens/ReturnRequestsScreen';
import CreateCampaignScreen from '../features/Ads/screens/CreateCampaignScreen';
import SettingsScreen from '../features/Settings/screens/SettingsScreen';
import ChatDetailScreen from '@/features/Chat/screens/ChatDetailScreen';
import ChatListScreen from '@/features/Chat/screens/ChatListScreen';
import NotificationsScreen from '@/features/Notifications/screens/NotificationsScreen';

// Screens shared across roles
import PrivacyPolicyScreen from '@/features/Legal/screens/PrivacyPolicyScreen';
import TermsScreen from '@/features/Legal/screens/TermsScreen';
import SellerProfileScreen from '../features/Profile/screens/SellerProfileScreen';
import ChangePasswordScreen from '@/features/Profile/screens/ChangePasswordScreen';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();

export default function SellerNavigator({ onLogout }: any) {
  useTranslation();
  return (
    <Stack.Navigator
      id="Seller"
      initialRouteName="SellerMain"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="SellerMain" component={SellerTabs} />
      <Stack.Screen
        name="SellerOrderDetail"
        component={SellerOrderDetailScreen}
      />
      <Stack.Screen
        name="SellerQueryDetail"
        component={SellerQueryDetailScreen}
      />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="ImportExport" component={ImportExportScreen} />
      <Stack.Screen name="CancelledOrders" component={CancelledOrdersScreen} />
      <Stack.Screen name="ReturnRequests" component={ReturnRequestsScreen} />
      <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
      <Stack.Screen name="ChatList">
        {props => <ChatListScreen {...props} role="seller" />}
      </Stack.Screen>
      <Stack.Screen name="ChatDetail">
        {props => <ChatDetailScreen {...props} role="seller" />}
      </Stack.Screen>
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings">
        {props => <SettingsScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen name="Profile" component={SellerProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ animation: 'fade_from_bottom', animationDuration: 600 }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ animation: 'fade_from_bottom', animationDuration: 600 }}
      />
    </Stack.Navigator>
  );
}
