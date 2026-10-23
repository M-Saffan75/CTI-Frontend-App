import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import AddCardModal from '../components/AddCardModal';
import { fetchSellerAdsApi } from '@/roles/Seller/services/sellerApi';

interface CampaignItem {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  status: 'Active' | 'Under Review' | 'Shipped' | 'Paused';
  totalBudget: string;
  dailyBudget: string;
  spent: string;
  impressions: string;
  clicks: string;
}

const CAMPAIGN_STATUS_FILTERS = ['All', 'Active', 'Under Review', 'Shipped', 'Paused'];

const MOCK_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'camp-1',
    name: 'Summer fashion Sale',
    type: 'Sponsored Products',
    dateRange: '30 Jun 2026 - 05 Jul 2026',
    status: 'Active',
    totalBudget: '$50:00',
    dailyBudget: '$10:00',
    spent: '$1.00',
    impressions: '37',
    clicks: '7',
  },
];

export default function AdsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(MOCK_CAMPAIGNS);
  const [isAddCardVisible, setIsAddCardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAds = useCallback(async () => {
    try {
      const data = await fetchSellerAdsApi();
      if (data && data.length > 0) {
        setCampaigns(
          data.map((ad: any) => ({
            id: ad._id || ad.id,
            name: ad.name || ad.title || 'Ad Campaign',
            type: ad.type || 'Sponsored Products',
            dateRange: `${ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'Active'} - ${ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'Ongoing'}`,
            status: ad.status || 'Active',
            totalBudget: `$${ad.totalBudget || ad.budget || '50.00'}`,
            dailyBudget: `$${ad.dailyBudget || '10.00'}`,
            spent: `$${ad.spent || '0.00'}`,
            impressions: String(ad.impressions || 0),
            clicks: String(ad.clicks || 0),
          }))
        );
      }
    } catch {
      // Keep initial
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAds();
    setRefreshing(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (selectedFilter === 'All') return true;
    return c.status === selectedFilter;
  });

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      {/* Top Header matching Ads screens.png */}
      <FadeUp delay={30} duration={300}>
        <View style={styles.topSection}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Advertisement Campaigns</Text>
          <Text style={[styles.mainSub, { color: colors.textMuted }]}>
            Promote your products and store to{'\n'}increase visibility
          </Text>

          {/* Create Campaign Button with prominent border & clear style */}
          <Squeeze onPress={() => navigation?.navigate('CreateCampaign')} scale={0.98}>
            <View style={[styles.createBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.createBtnText}>Create Campaign</Text>
            </View>
          </Squeeze>
        </View>

        {/* Filter Pills matching Figma: All, Active, Under Review, Shipped, Paused */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}>
          {CAMPAIGN_STATUS_FILTERS.map(filter => {
            const isSelected = selectedFilter === filter;
            return (
              <Squeeze key={filter} onPress={() => setSelectedFilter(filter)}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceAlt,
                      borderColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      { color: isSelected ? '#FFFFFF' : colors.textMuted },
                      isSelected && { fontFamily: fonts.bold },
                    ]}>
                    {filter}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>
      </FadeUp>

      {/* Campaign Cards with Full Width Layout matching Ads screens.png */}
      <View style={styles.campaignList}>
        {filteredCampaigns.map((camp, idx) => (
          <FadeUp key={camp.id} delay={60 + idx * 40} duration={320}>
            <View
              style={[
                styles.campCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {/* Top Row: Cube icon, Name, Subtitle, Date & Active Status Badge */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cubeIconBox}>
                  <Text style={styles.cubeEmoji}>📦</Text>
                </View>

                <View style={styles.titleInfo}>
                  <Text style={[styles.campName, { color: colors.text }]}>{camp.name}</Text>
                  <Text style={[styles.campType, { color: colors.textMuted }]}>{camp.type}</Text>
                  <View style={styles.dateRow}>
                    <Text style={{ fontSize: 12 }}>📅</Text>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      {camp.dateRange}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{camp.status}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Budget & Bid Section - Clean Full-Width Rows with chevron */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Budget & Bid</Text>
                  <Text style={[styles.chevronArrow, { color: colors.textMuted }]}>›</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{camp.totalBudget}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Daily</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{camp.dailyBudget}</Text>
                </View>
              </View>

              {/* Performance Section - Clean Full-Width Rows */}
              <View style={[styles.sectionBlock, { marginTop: 4 }]}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Performance</Text>

                <View style={styles.dataRow}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Spent</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{camp.spent}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Impr.</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{camp.impressions}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Clicks</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{camp.clicks}</Text>
                </View>
              </View>
            </View>
          </FadeUp>
        ))}
      </View>

      <AddCardModal
        visible={isAddCardVisible}
        onClose={() => setIsAddCardVisible(false)}
        onCardAdded={() => setIsAddCardVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  topSection: { gap: 8 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 24, letterSpacing: -0.3 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },

  createBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EA580C',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 15,
  },

  filterPillsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13 },

  campaignList: { gap: 14 },
  campCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cubeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeEmoji: { fontSize: 22 },
  titleInfo: { flex: 1, gap: 3 },
  campName: { fontFamily: fonts.bold, fontSize: 16 },
  campType: { fontFamily: fonts.regular, fontSize: 13 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateText: { fontFamily: fonts.regular, fontSize: 12 },

  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#10B981',
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  divider: { height: 1, width: '100%', marginVertical: 4 },

  sectionBlock: { gap: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: { fontFamily: fonts.bold, fontSize: 14 },
  chevronArrow: { fontSize: 18, fontFamily: fonts.bold },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13 },
  rowValue: { fontFamily: fonts.bold, fontSize: 14 },
});
