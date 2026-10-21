import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import SellerHeader from '../components/SellerHeader';
import SellerTopTabs from '../components/SellerTopTabs';

// 9 Feature Tab Screens
import DashboardScreen from '../features/Dashboard/screens/DashboardScreen';
import ProductListScreen from '../features/Product/screens/ProductListScreen';
import OrderManagementScreen from '../features/Orders/screens/OrderManagementScreen';
import WalletScreen from '../features/Wallet/screens/WalletScreen';
import AdsScreen from '../features/Ads/screens/AdsScreen';
import ReportsScreen from '../features/Reports/screens/ReportsScreen';
import InvoicesScreen from '../features/Invoices/screens/InvoicesScreen';
import EnquiriesScreen from '../features/Enquiries/screens/EnquiriesScreen';
import ReviewsScreen from '../features/Reviews/screens/ReviewsScreen';

export default function SellerMainScreen({ navigation, route }) {
  const { colors } = useTheme();
  const initialTab = route?.params?.initialTab || 'Dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen onSelectTab={setActiveTab} navigation={navigation} />;
      case 'Product':
        return <ProductListScreen navigation={navigation} />;
      case 'OrderManagement':
        return <OrderManagementScreen navigation={navigation} />;
      case 'Wallet':
        return <WalletScreen navigation={navigation} />;
      case 'Ads':
        return <AdsScreen navigation={navigation} />;
      case 'Reported':
        return <ReportsScreen navigation={navigation} />;
      case 'Invoices':
        return <InvoicesScreen navigation={navigation} />;
      case 'Enquiries':
        return <EnquiriesScreen navigation={navigation} />;
      case 'Reviews':
        return <ReviewsScreen navigation={navigation} />;
      default:
        return <DashboardScreen onSelectTab={setActiveTab} navigation={navigation} />;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SellerHeader navigation={navigation} />
      <SellerTopTabs activeTab={activeTab} onChange={setActiveTab} />
      <View style={styles.body}>{renderActiveTab()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
});
