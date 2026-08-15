import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RepairmanHomeScreen from '../features/Home/screens/RepairmanHomeScreen';
import JobBoardDetailScreen from '../features/Jobs/screens/JobBoardDetailScreen';
import SendProposalScreen from '../features/Jobs/screens/SendProposalScreen';
import MyJobDetailScreen from '../features/Jobs/screens/MyJobDetailScreen';
import BankingInformationScreen from '../features/Earnings/screens/BankingInformationScreen';
import ChatListScreen from '../features/Chat/screens/ChatListScreen';
import ChatDetailScreen from '../features/Chat/screens/ChatDetailScreen';
import SettingsScreen from '../features/Settings/screens/SettingsScreen';
import PrivacyPolicyScreen from '@/features/Legal/screens/PrivacyPolicyScreen';
import TermsScreen from '@/features/Legal/screens/TermsScreen';

const Stack = createNativeStackNavigator();

export default function RepairmanNavigator({ onLogout }) {
  return (
    <Stack.Navigator
      id="Repairman"
      screenOptions={{
        headerShown: false,
        animation: 'simple_push',
        animationDuration: 380,
      }}>
      {/* Dashboard/JobBoard/MyOffers/MyJobs/Reviews/Earnings/PartsOrder all
          live inside Home as local tabs, not separate routes. */}
      <Stack.Screen name="Home" component={RepairmanHomeScreen} />
      <Stack.Screen name="JobBoardDetail" component={JobBoardDetailScreen} />
      <Stack.Screen name="SendProposal" component={SendProposalScreen} />
      <Stack.Screen name="MyJobDetail" component={MyJobDetailScreen} />
      <Stack.Screen name="BankingInformation" component={BankingInformationScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="Settings">
        {props => <SettingsScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
      {/* Legal documents slide up from the bottom instead of in from the side. */}
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
