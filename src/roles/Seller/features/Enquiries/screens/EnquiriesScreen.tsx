import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { searchBold } from '@/assets/icons';
import { dummyProfileExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

interface EnquiryCardItem {
  id: string;
  queryId: string;
  customerName: string;
  question: string;
  date: string;
  status: 'Closed' | 'Open' | 'Replied';
  statusColor: string;
  type: 'Product' | 'Order';
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All (3)' },
  { id: 'open', label: 'Open (1)' },
  { id: 'replied', label: 'Replied (1)' },
  { id: 'closed', label: 'Closed (3)' },
];

const MOCK_ENQUIRIES: EnquiryCardItem[] = [
  {
    id: 'e-1',
    queryId: 'QRY-000004',
    customerName: 'Customer',
    question: 'Is this avalaible',
    date: '30/06/2026',
    status: 'Closed',
    statusColor: '#6B7280',
    type: 'Product',
  },
  {
    id: 'e-2',
    queryId: 'QRY-000005',
    customerName: 'Muhammad Bilal',
    question: 'Does this come with international warranty?',
    date: '01/07/2026',
    status: 'Open',
    statusColor: '#EF4444',
    type: 'Product',
  },
  {
    id: 'e-3',
    queryId: 'QRY-000006',
    customerName: 'Ayesha Khan',
    question: 'Can you dispatch today via express courier?',
    date: '01/07/2026',
    status: 'Replied',
    statusColor: '#10B981',
    type: 'Order',
  },
];

export default function EnquiriesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'Product Queries' | 'Order Queries'>('Product Queries');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEnquiries = MOCK_ENQUIRIES.filter(item => {
    if (activeTab === 'Product Queries' && item.type !== 'Product') return false;
    if (activeTab === 'Order Queries' && item.type !== 'Order') return false;
    if (selectedStatus === 'open' && item.status !== 'Open') return false;
    if (selectedStatus === 'replied' && item.status !== 'Replied') return false;
    if (selectedStatus === 'closed' && item.status !== 'Closed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.queryId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openChat = (item: EnquiryCardItem) => {
    navigation?.navigate('ChatDetail', {
      customerName: item.customerName,
      queryId: item.queryId,
      question: item.question,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* Top Search Bar & Refresh Button matching Enquiries screen.png */}
      <FadeUp delay={30} duration={300}>
        <View style={styles.topSearchRow}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Icon source={searchBold} size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search order custom product"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.refreshBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills matching Figma: All (3), Open (1), Replied (1), Closed (3) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}>
          {STATUS_FILTERS.map(pill => {
            const isSelected = selectedStatus === pill.id;
            return (
              <Squeeze key={pill.id} onPress={() => setSelectedStatus(pill.id)}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      { color: isSelected ? colors.onPrimary : colors.textMuted },
                      isSelected && { fontFamily: fonts.bold },
                    ]}>
                    {pill.label}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>

        {/* Sub-tabs: Product Queries & Order Queries */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('Product Queries')}
            style={[
              styles.tabItem,
              activeTab === 'Product Queries' && [
                styles.activeTabItem,
                { borderBottomColor: colors.primary },
              ],
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'Product Queries' ? colors.primary : colors.textMuted },
                activeTab === 'Product Queries' && { fontFamily: fonts.bold },
              ]}>
              Product Queries
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Order Queries')}
            style={[
              styles.tabItem,
              activeTab === 'Order Queries' && [
                styles.activeTabItem,
                { borderBottomColor: colors.primary },
              ],
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'Order Queries' ? colors.primary : colors.textMuted },
                activeTab === 'Order Queries' && { fontFamily: fonts.bold },
              ]}>
              Order Queries
            </Text>
          </TouchableOpacity>
        </View>
      </FadeUp>

      {/* Enquiries Cards List matching Figma */}
      <View style={styles.enquiriesList}>
        {filteredEnquiries.map((item, idx) => (
          <FadeUp key={item.id} delay={60 + idx * 40} duration={320}>
            <Squeeze onPress={() => openChat(item)}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.customerRow}>
                    <Image source={dummyProfileExtra} style={styles.avatar} />
                    <View>
                      <Text style={[styles.customerName, { color: colors.text }]}>
                        {item.customerName}
                      </Text>
                      <Text style={[styles.questionText, { color: colors.textMuted }]}>
                        {item.question}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: item.statusColor + '20', borderColor: item.statusColor },
                    ]}>
                    <Text style={[styles.statusPillText, { color: item.statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.cardFooter}>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>{item.date}</Text>
                  <Text style={[styles.queryIdText, { color: colors.primary }]}>{item.queryId} →</Text>
                </View>
              </View>
            </Squeeze>
          </FadeUp>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  topSearchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: { borderBottomWidth: 2 },
  tabText: { fontFamily: fonts.medium, fontSize: 14 },

  enquiriesList: { gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  customerName: { fontFamily: fonts.bold, fontSize: 14 },
  questionText: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: { fontFamily: fonts.medium, fontSize: 12 },

  divider: { height: 1, width: '100%' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: { fontFamily: fonts.regular, fontSize: 12 },
  queryIdText: { fontFamily: fonts.medium, fontSize: 12 },
});
