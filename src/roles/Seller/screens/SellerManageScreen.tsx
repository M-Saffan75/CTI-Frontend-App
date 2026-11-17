import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { useTheme } from '@/theme/ThemeContext';
import SellerHeader from '../components/SellerHeader';
import SellerTopTabs from '../components/SellerTopTabs';
import ProductListScreen from '../features/Product/screens/ProductListScreen';
import OrderManagementScreen from '../features/Orders/screens/OrderManagementScreen';
import WalletScreen from '../features/Wallet/screens/WalletScreen';
import AdsScreen from '../features/Ads/screens/AdsScreen';
import ReportsScreen from '../features/Reports/screens/ReportsScreen';
import InvoicesScreen from '../features/Invoices/screens/InvoicesScreen';
import EnquiriesScreen from '../features/Enquiries/screens/EnquiriesScreen';
import ReviewsScreen from '../features/Reviews/screens/ReviewsScreen';
import { useTranslation } from 'react-i18next';

const FIRST_TAB = 'Product';

const TAB_SCREENS: Record<string, React.ComponentType<any>> = {
  Product: ProductListScreen,
  OrderManagement: OrderManagementScreen,
  Wallet: WalletScreen,
  Ads: AdsScreen,
  Reported: ReportsScreen,
  Invoices: InvoicesScreen,
  Enquiries: EnquiriesScreen,
  Reviews: ReviewsScreen,
};

// Every tab is mounted the first time it is opened and then kept, so switching
// tabs never reloads or flashes.
export default function SellerManageScreen({ navigation, route }: any) {
  useTranslation();
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const requestedTab = route?.params?.initialTab;
  const [activeTab, setActiveTab] = useState<string>(
    TAB_SCREENS[requestedTab] ? requestedTab : FIRST_TAB,
  );
  const [visited, setVisited] = useState<string[]>([activeTab]);
  const activeRef = useRef(activeTab);

  const selectTab = useCallback((tab: string) => {
    if (!TAB_SCREENS[tab]) return;
    activeRef.current = tab;
    setActiveTab(tab);
    setVisited(prev => (prev.includes(tab) ? prev : [...prev, tab]));
  }, []);

  // Home is its own bottom tab, so a request for the old Dashboard option goes there
  useEffect(() => {
    if (requestedTab === 'Dashboard') {
      navigation.navigate('HomeTab');
    } else if (requestedTab) {
      selectTab(requestedTab);
    }
  }, [route?.params, requestedTab, selectTab, navigation]);

  // Android back: any option goes to the first option. From the first option the
  // tab navigator takes over and goes to Home, and Home exits the app.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (activeRef.current !== FIRST_TAB) {
          selectTab(FIRST_TAB);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [selectTab]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SellerHeader navigation={navigation} />
      <SellerTopTabs activeTab={activeTab} onChange={selectTab} />
      <View style={styles.body}>
        {visited.map(key => {
          const Screen = TAB_SCREENS[key];
          const isActive = key === activeTab;
          return (
            <View key={key} style={[styles.pane, !isActive && styles.hidden]}>
              <Screen navigation={navigation} isActive={isFocused && isActive} params={route?.params} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  pane: { flex: 1 },
  hidden: { display: 'none' },
});
