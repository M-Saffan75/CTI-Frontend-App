import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import RepairmanHeader from '../../../components/RepairmanHeader';
import RepairmanTabs from '../../../components/RepairmanTabs';
import DashboardContent from '../../Dashboard/screens/DashboardScreen';
import JobBoardContent from '../../Jobs/screens/JobBoardScreen';
import MyOffersContent from '../../Jobs/screens/MyOffersScreen';
import MyJobsContent from '../../Jobs/screens/MyJobsScreen';
import ReviewsContent from '../../Reviews/screens/ReviewsScreen';
import EarningsContent from '../../Earnings/screens/EarningsScreen';
import PartsOrderContent from '../../PartsOrder/screens/PartsOrderScreen';

// One screen, local tab state — same pattern as the Customer side's
// JobsScreen. Switching tabs is a plain re-render, not a navigation, so it's
// instant. Only drilling into a detail (Job Detail, Send Proposal, Banking
// Information...) is a real navigated screen.
export default function RepairmanHomeScreen({ navigation, route }) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(route.params?.tab ?? 'Dashboard');

  // A detail screen (e.g. Send Proposal) can jump back here on a specific
  // tab via `navigation.navigate('Home', { tab: 'MyOffers' })`.
  useEffect(() => {
    if (route.params?.tab) setActiveTab(route.params.tab);
  }, [route.params?.tab]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <RepairmanTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'Dashboard' && <DashboardContent />}
      {activeTab === 'JobBoard' && <JobBoardContent navigation={navigation} />}
      {activeTab === 'MyOffers' && <MyOffersContent />}
      {activeTab === 'MyJobs' && <MyJobsContent navigation={navigation} />}
      {activeTab === 'Reviews' && <ReviewsContent />}
      {activeTab === 'Earnings' && <EarningsContent navigation={navigation} />}
      {activeTab === 'PartsOrder' && <PartsOrderContent />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
