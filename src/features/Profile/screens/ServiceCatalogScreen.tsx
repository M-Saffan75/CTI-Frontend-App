import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import {
  arrowLeftBold,
  chevronDownBold,
  commentBold,
  eyeBold,
  imageBold,
  mapPinBold,
  mobileBold,
  searchBold,
  toolExtra,
  userBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { CatalogServiceItem, INITIAL_CATALOG_SERVICES } from '../data/profileData';

const STATUS_OPTIONS = ['All Status', 'Pending', 'In Progress', 'Completed'];

export default function ServiceCatalogScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [services] = useState<CatalogServiceItem[]>(INITIAL_CATALOG_SERVICES);
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = (services || []).filter(item => {
    if (selectedStatus !== 'All Status' && item?.status !== selectedStatus) return false;
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item?.title?.toLowerCase()?.includes(q) ||
        item?.description?.toLowerCase()?.includes(q) ||
        item?.customerName?.toLowerCase()?.includes(q) ||
        item?.device?.toLowerCase()?.includes(q)
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#10B981';
      case 'In Progress':
        return '#F59E0B';
      case 'Pending':
      default:
        return '#F59E0B';
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={[styles.backCircle, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>
      </View>

      <FlatList
        data={filteredServices}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Service Catalog</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              All repair jobs at a glance
            </Text>

            {/* Filter Row: Status Dropdown & Clear Filters */}
            <View style={styles.filtersRow}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                  style={[
                    styles.statusDropdownBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.statusDropdownText, { color: colors.text }]}>
                    {selectedStatus}
                  </Text>
                  <Icon
                    source={chevronDownBold}
                    size={14}
                    color={colors.textMuted}
                    style={showStatusDropdown ? { transform: [{ rotate: '180deg' }] } : undefined}
                  />
                </TouchableOpacity>

                {showStatusDropdown && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    {STATUS_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setSelectedStatus(opt);
                          setShowStatusDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          selectedStatus === opt && { backgroundColor: colors.primary + '14' },
                        ]}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: selectedStatus === opt ? colors.primary : colors.text },
                          ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Squeeze
                onPress={() => {
                  setSelectedStatus('All Status');
                  setSearchQuery('');
                }}>
                <View style={[styles.clearBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.clearBtnText, { color: colors.onPrimary }]}>
                    Clear Filters
                  </Text>
                </View>
              </Squeeze>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Icon source={searchBold} size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Search services, customer or brand...."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            {/* Results Count */}
            <Text style={[styles.counterText, { color: colors.textMuted }]}>
              Showing <Text style={{ fontFamily: fonts.bold, color: colors.text }}>{filteredServices.length}</Text> Services
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeUp delay={40 + index * 30} duration={300}>
            <View
              style={[
                styles.serviceCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {/* Image Preview Banner */}
              <View
                style={[
                  styles.imageBanner,
                  { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '30' },
                ]}>
                <Icon source={imageBold} size={32} color={colors.primary} />
                <Text style={[styles.bannerText, { color: colors.primary }]}>Service Image</Text>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(item.status) + '22',
                      borderColor: getStatusColor(item.status),
                    },
                  ]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={[styles.serviceTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.serviceDesc, { color: colors.textMuted }]}>
                  {item.description}
                </Text>

                {/* Pricing */}
                <View style={styles.priceRow}>
                  <Text style={[styles.priceMain, { color: colors.text }]}>{item.price}</Text>
                  <Text style={[styles.priceSub, { color: colors.textMuted }]}>
                    Base: {item.basePrice} | Parts: {item.partsPrice}
                  </Text>
                </View>

                {/* Details Grid */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Icon source={toolExtra} size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {item.category}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Icon source={userBold} size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {item.customerName}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Icon source={mobileBold} size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {item.device}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Icon source={mapPinBold} size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {item.location}
                    </Text>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                  <Squeeze
                    onPress={() =>
                      navigation?.navigate('ChatDetail', {
                        customerName: item.customerName,
                        question: item.title,
                        queryId: `SRV-${item.id}`,
                      })
                    }
                    style={{ flex: 1 }}>
                    <View style={[styles.chatBtn, { backgroundColor: colors.primary }]}>
                      <Icon source={commentBold} size={16} color={colors.onPrimary} />
                      <Text style={[styles.chatBtnText, { color: colors.onPrimary }]}>Chat</Text>
                    </View>
                  </Squeeze>

                  <Squeeze
                    onPress={() =>
                      Alert.alert(item.title, `${item.description}\n\nPrice: ${item.price}`)
                    }
                    style={{ flex: 1 }}>
                    <View
                      style={[
                        styles.viewBtn,
                        { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                      ]}>
                      <Icon source={eyeBold} size={16} color={colors.text} />
                      <Text style={[styles.viewBtnText, { color: colors.text }]}>View</Text>
                    </View>
                  </Squeeze>
                </View>
              </View>
            </View>
          </FadeUp>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: { width: 110, height: 50 },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  statusDropdownBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDropdownText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 99,
    elevation: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  clearBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  searchBar: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  counterText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 4,
  },
  serviceCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 12,
  },
  imageBanner: {
    height: 140,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  bannerText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  cardBody: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  serviceTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  serviceDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginVertical: 2,
  },
  priceMain: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  priceSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  chatBtn: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  viewBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
