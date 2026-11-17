import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import RepairmanHeader from '../../../components/RepairmanHeader';
import RepairmanTabs from '../../../components/RepairmanTabs';
import JobBoardContent from './JobBoardScreen';
import MyOffersContent from './MyOffersScreen';
import MyJobsContent from './MyJobsScreen';
import ReviewsContent from '../../Reviews/screens/ReviewsScreen';
import PartsOrderContent from '../../PartsOrder/screens/PartsOrderScreen';
import { useTranslation } from 'react-i18next';

// The "Jobs" bottom tab. Everything work-related lives here behind one row of
// local tabs — switching is a plain re-render, not a navigation, so it's
// instant. Only drilling into a detail (Job Detail, Send Proposal, Banking
// Information...) is a real navigated screen. Dashboard is deliberately not
// here — it's its own bottom tab.
export default function JobsScreen({ navigation, route }) {
  useTranslation();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(route.params?.tab ?? 'JobBoard');

  // A detail screen (e.g. Send Proposal) can jump back here on a specific tab
  // via `navigation.navigate('JobsTab', { tab: 'MyOffers' })`.
  useEffect(() => {
    if (route.params?.tab) setActiveTab(route.params.tab);
  }, [route.params?.tab, route.params?.at]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <RepairmanTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'JobBoard' && <JobBoardContent navigation={navigation} />}
      {activeTab === 'MyOffers' && <MyOffersContent navigation={navigation} />}
      {activeTab === 'MyJobs' && <MyJobsContent navigation={navigation} />}
      {activeTab === 'Reviews' && <ReviewsContent />}
      {activeTab === 'PartsOrder' && <PartsOrderContent navigation={navigation} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
