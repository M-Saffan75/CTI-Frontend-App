import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  clockBold,
  commentDotsBold,
  heartExtra,
  mapPinBold,
  phoneBold,
  searchBold,
  shieldBold,
  shoppingCartExtra,
  starExtra,
  userBold,
  closeIcon,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import { useCart } from '@/roles/Customer/context/CartContext';
import repairmanApi, { MobileRepairman } from '@/services/repairmanApi';
import { startChat } from '@/services/chatApi';

function RepairmanCard({
  repairman,
  navigation,
  onViewProfile,
}: {
  repairman: MobileRepairman;
  navigation: any;
  onViewProfile: (repairman: MobileRepairman) => void;
}) {
  const { colors } = useTheme();

  const handleStartChat = async () => {
    if (!repairman.id) return;
    try {
      const res = await startChat({ repairmanId: repairman.id });
      const targetName = res.chat?.user?.name || res.chat?.repairman?.name || repairman.name;
      const targetAvatar = res.chat?.user?.avatar || res.chat?.repairman?.avatar || repairman.photo;
      navigation.navigate('ChatDetail', {
        chatId: res.chat?._id || res.chat?.chatId,
        participantId: repairman.id,
        participantName: targetName,
        participantAvatar: targetAvatar,
      });
    } catch {
      navigation.navigate('ChatList');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: repairman.photo }} style={styles.photo} />

      <View style={styles.cardBody}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {repairman.name}
        </Text>
        <Text style={[styles.shopName, { color: colors.primary }]} numberOfLines={1}>
          {repairman.specialty || repairman.shopName || 'Device Repair Specialist'}
        </Text>

        <View style={[styles.locationPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
            {repairman.location}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Icon source={shieldBold} size={12} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
            {repairman.specialty}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Icon source={starExtra} size={12} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {repairman.rating > 0 ? repairman.rating.toFixed(1) : '5.0'} • {repairman.experience}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => onViewProfile(repairman)}>
            <Text style={[styles.viewProfile, { color: colors.primary }]}>View Details</Text>
          </TouchableOpacity>
          <Button
            title="Book & Chat"
            size="sm"
            onPress={handleStartChat}
            style={styles.bookButton}
          />
        </View>
      </View>
    </View>
  );
}

export default function ExpertRepairmenScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { ids: wishlistIds } = useWishlist();
  const { cartCount } = useCart();
  const [repairmen, setRepairmen] = useState<MobileRepairman[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const initialQuery = route?.params?.query || route?.params?.specialization || '';
  const [search, setSearch] = useState<string>(initialQuery);
  const [selectedRepairman, setSelectedRepairman] = useState<MobileRepairman | null>(null);

  const searchTimer = useRef<any>(null);

  useEffect(() => {
    if (route?.params?.query) {
      setSearch(route.params.query);
    }
  }, [route?.params?.query]);

  const loadRepairmen = useCallback(async () => {
    try {
      const res = await repairmanApi.getRepairmen({ limit: 50 });
      setRepairmen(res.repairmans);
    } catch (err) {
      if (__DEV__) console.warn('Failed to load expert repairmen:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRepairmen();
  }, [loadRepairmen]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRepairmen();
  };

  // Filter repairmen by search query
  const filteredRepairmen = repairmen.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.shopName.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.specialty.toLowerCase().includes(q) ||
      r.specializations.some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Wishlist')} scale={0.85}>
            <View>
              <Icon source={heartExtra} size={24} color={colors.text} />
              {wishlistIds.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{wishlistIds.length}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <View>
              <Icon source={shoppingCartExtra} size={24} color={colors.text} />
              {cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </Squeeze>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>
          Expert Repairmen{' '}
          <Text style={{ color: colors.primary }}>
            ({filteredRepairmen.length})
          </Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Verified technicians &amp; electronics specialists available for booking
        </Text>

        {/* Search Bar */}
        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Icon source={searchBold} size={20} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, city, or specialization..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading verified repairmen..."
            style={{ paddingVertical: 50 }}
          />
        ) : filteredRepairmen.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon source={userBold} size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Expert Repairmen Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {search.trim()
                ? 'Try searching with different keywords.'
                : 'No registered repair specialists match current criteria.'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredRepairmen.map((repairman, index) => (
              <FadeUp
                key={repairman.id || `rep-${index}`}
                delay={60 + index * 35}
                duration={500}
                style={styles.gridItem}>
                <RepairmanCard
                  repairman={repairman}
                  navigation={navigation}
                  onViewProfile={r => setSelectedRepairman(r)}
                />
              </FadeUp>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Repairman Details Modal */}
      {selectedRepairman && (
        <Modal
          visible={!!selectedRepairman}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRepairman(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHead}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Repairman Profile</Text>
                <TouchableOpacity
                  onPress={() => setSelectedRepairman(null)}
                  hitSlop={10}
                  style={styles.closeBtn}>
                  <Icon source={closeIcon} size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                <View style={styles.modalProfileRow}>
                  <Image source={{ uri: selectedRepairman.photo }} style={styles.modalPhoto} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.modalName, { color: colors.text }]}>
                      {selectedRepairman.name}
                    </Text>
                    <Text style={[styles.modalShop, { color: colors.primary }]}>
                      {selectedRepairman.shopName}
                    </Text>
                    <View style={styles.modalMetaRow}>
                      <Icon source={starExtra} size={13} color={colors.primary} />
                      <Text style={[styles.modalMetaText, { color: colors.textMuted }]}>
                        {selectedRepairman.rating.toFixed(1)} Rating • {selectedRepairman.experience}
                      </Text>
                    </View>
                  </View>
                </View>

                {!!selectedRepairman.location && (
                  <View style={styles.infoRow}>
                    <Icon source={mapPinBold} size={16} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {selectedRepairman.fullAddress || selectedRepairman.location}
                    </Text>
                  </View>
                )}

                {selectedRepairman.workingHours?.start && selectedRepairman.workingHours?.end && (
                  <View style={styles.infoRow}>
                    <Icon source={clockBold} size={16} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {selectedRepairman.workingHours.start} - {selectedRepairman.workingHours.end}
                    </Text>
                  </View>
                )}

                {selectedRepairman.specializations.length > 0 && (
                  <View style={styles.specializationsWrap}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>
                      Specializations:
                    </Text>
                    <View style={styles.specChips}>
                      {selectedRepairman.specializations.map((spec, sIdx) => (
                        <View
                          key={`spec-${spec}-${sIdx}`}
                          style={[styles.specChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Text style={[styles.specChipText, { color: colors.text }]}>
                            {spec}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedRepairman.workingDays && selectedRepairman.workingDays.length > 0 && (
                  <View style={styles.specializationsWrap}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>
                      Working Days:
                    </Text>
                    <Text style={[styles.infoText, { color: colors.textMuted }]}>
                      {selectedRepairman.workingDays.join(', ')}
                    </Text>
                  </View>
                )}

                <Button
                  title="Chat with Specialist"
                  size="md"
                  icon={commentDotsBold}
                  iconPosition="left"
                  onPress={async () => {
                    const r = selectedRepairman;
                    setSelectedRepairman(null);
                    try {
                      const res = await startChat({ repairmanId: r.id });
                      const targetName = res.chat?.user?.name || res.chat?.repairman?.name || r.name;
                      const targetAvatar = res.chat?.user?.avatar || res.chat?.repairman?.avatar || r.photo;
                      navigation.navigate('ChatDetail', {
                        chatId: res.chat?._id || res.chat?.chatId,
                        participantId: r.id,
                        participantName: targetName,
                        participantAvatar: targetAvatar,
                      });
                    } catch {
                      navigation.navigate('ChatList');
                    }
                  }}
                  style={{ marginTop: 18 }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 9, color: '#FFFFFF' },

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 16 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, padding: 0 },

  emptyWrap: { paddingVertical: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18, marginTop: 10 },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  gridItem: { width: '48%', marginBottom: 14 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  photo: { width: '100%', height: 110 },
  cardBody: { padding: 10, gap: 6 },
  name: { fontFamily: fonts.bold, fontSize: 14 },
  shopName: { fontFamily: fonts.regular, fontSize: 12 },
  locationPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  locationText: { fontFamily: fonts.regular, fontSize: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: fonts.regular, fontSize: 11 },
  actions: { gap: 8, marginTop: 4 },
  viewProfile: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center', paddingVertical: 4 },
  bookButton: { alignSelf: 'stretch' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8883',
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 17 },
  closeBtn: { padding: 4 },
  modalBody: { paddingTop: 14, gap: 14 },
  modalProfileRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  modalPhoto: { width: 64, height: 64, borderRadius: 32 },
  modalName: { fontFamily: fonts.bold, fontSize: 16 },
  modalShop: { fontFamily: fonts.medium, fontSize: 13 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalMetaText: { fontFamily: fonts.regular, fontSize: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontFamily: fonts.regular, fontSize: 13, flex: 1 },
  specializationsWrap: { gap: 6 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 13 },
  specChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  specChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  specChipText: { fontFamily: fonts.regular, fontSize: 11 },
});
