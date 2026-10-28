import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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
  bellBold,
  checkCircleBold,
  chevronDownBold,
  chevronRightBold,
  closeIcon,
  colorPaletteIcon,
  commentDotsBold,
  desktopBold,
  facebookIcon,
  headphonesBold,
  heartExtra,
  linkedinIcon,
  mapPinBold,
  menuBold,
  mobileBold,
  plusSquareBold,
  searchBold,
  shoppingCartExtra,
  starExtra,
  tagBold,
  twitterIcon,
  usersThreeBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import { useCart } from '@/roles/Customer/context/CartContext';
import blogApi, { MobileBlog, mapBackendToBlog } from '@/services/blogApi';
import homeApi, { HomeData } from '@/services/homeApi';
import { fetchUnreadChatCount, startChat } from '@/services/chatApi';
import {
  DeviceBrand,
  DeviceModel,
  fetchModelsByBrand,
  fetchPublicBrands,
} from '@/services/deviceBrandApi';

const SERVICE_ICONS = {
  'Mobile Repair': mobileBold,
  'Laptop Repair': desktopBold,
  Accessories: headphonesBold,
  'Sell Device': tagBold,
};

function Badge({ label }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { borderColor: colors.primary }]}>
      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function Header({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { ids: wishlistIds } = useWishlist();
  const { cartCount, refreshCart } = useCart();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadChatCount();
      setUnreadMsgCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUnreadCount();
      refreshCart();
    });
    return unsubscribe;
  }, [navigation, loadUnreadCount, refreshCart]);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Squeeze onPress={() => navigation.navigate('Wishlist')} scale={0.85}>
            <View>
              <Icon source={heartExtra} size={22} color={colors.text} />
              {wishlistIds.length > 0 && (
                <View style={[styles.headerBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.headerBadgeText}>{wishlistIds.length}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <View>
              <Icon source={shoppingCartExtra} size={22} color={colors.text} />
              {cartCount > 0 && (
                <View style={[styles.headerBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.headerBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Notifications')} scale={0.85}>
            <Icon source={bellBold} size={22} color={colors.text} />
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('ChatList')} scale={0.85}>
            <View>
              <Icon source={commentDotsBold} size={22} color={colors.text} />
              {unreadMsgCount > 0 && (
                <View style={[styles.headerBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.headerBadgeText}>{unreadMsgCount}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Settings')} scale={0.85}>
            <Icon source={menuBold} size={24} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
        <Icon source={searchBold} size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => search.trim() && navigation?.navigate('ExpertRepairmen', { query: search.trim() })}
          returnKeyType="search"
          placeholder="Search order custom product"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
    </View>
  );
}

function Hero({ banners, navigation }: { banners?: any[]; navigation?: any }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const validBanners = Array.isArray(banners) ? banners.filter(b => !!b?.image) : [];
  if (validBanners.length === 0) return null;

  const onScrollEnd = (event: any) => {
    if (!width) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const handleBannerPress = (banner: any) => {
    const label = (banner.label || '').toLowerCase();
    const title = (banner.title || '').toLowerCase();
    if (label.includes('academy') || title.includes('academy') || title.includes('learn')) {
      navigation?.navigate('Academy');
    } else if (label.includes('repair') || title.includes('repair')) {
      navigation?.navigate('ExpertRepairmen');
    } else if (label.includes('marketplace') || label.includes('seller') || title.includes('seller')) {
      navigation?.navigate('ProductTab');
    } else {
      navigation?.navigate('BuyRefurbished');
    }
  };

  return (
    <View style={styles.heroWrap} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}>
        {validBanners.map((banner, i) => (
          <View key={banner._id || banner.id || i} style={{ width }}>
            <View style={[styles.hero, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}>
              <Image source={{ uri: banner.image }} style={styles.heroImage} resizeMode="cover" />
              {!!banner.label && (
                <View style={[styles.heroPill, { backgroundColor: colors.onPrimary }]}>
                  <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.heroPillText, { color: colors.primary }]}>{banner.label}</Text>
                </View>
              )}
              {!!banner.title && <Text style={[styles.heroTitle, { color: colors.text }]}>{banner.title}</Text>}
              {!!banner.description && (
                <Text style={[styles.heroText, { color: colors.textMuted }]} numberOfLines={3}>
                  {banner.description}
                </Text>
              )}
              <Button
                title="Explore Now"
                size="lg"
                onPress={() => handleBannerPress(banner)}
                style={styles.heroButton}
              />
            </View>
          </View>
        ))}
      </ScrollView>
      {validBanners.length > 1 && (
        <View style={styles.heroDots}>
          {validBanners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.heroDot,
                { backgroundColor: i === index ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ServiceFinder({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();

  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [colorsList, setColorsList] = useState<string[]>([]);

  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // Picker modal state
  const [pickerType, setPickerType] = useState<'brand' | 'model' | 'color' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Action modal state ("What do you want to do?")
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingBrands(true);
      const data = await fetchPublicBrands();
      if (isMounted) {
        setBrands(data);
        setLoadingBrands(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBrandSelect = async (brand: DeviceBrand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setSelectedColor(null);
    setModels([]);
    setColorsList([]);
    setPickerType(null);
    setPickerSearch('');

    const brandId = brand._id || brand.id;
    if (brandId) {
      setLoadingModels(true);
      const fetchedModels = await fetchModelsByBrand(brandId);
      setModels(fetchedModels);
      setLoadingModels(false);
    }
  };

  const handleModelSelect = (model: DeviceModel) => {
    setSelectedModel(model);
    setSelectedColor(null);
    const availableColors = Array.isArray(model.colors) ? model.colors : [];
    setColorsList(availableColors);
    setPickerType(null);
    setPickerSearch('');
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setPickerType(null);
    setPickerSearch('');
  };

  const handleFindService = () => {
    if (!selectedBrand || !selectedModel || !selectedColor) return;
    setShowActionModal(true);
  };

  const handleSearchRepairman = () => {
    setShowActionModal(false);
    const query = `${selectedBrand?.name || ''} ${selectedModel?.name || ''}`.trim();
    navigation?.navigate('ExpertRepairmen', { query });
  };

  const handleHireRepairman = () => {
    setShowActionModal(false);
    const query = selectedBrand?.name || '';
    navigation?.navigate('ExpertRepairmen', { query });
  };

  // Filtered options based on search in modal
  const filteredBrands = brands.filter(b =>
    (b.name || '').toLowerCase().includes(pickerSearch.toLowerCase())
  );
  const filteredModels = models.filter(m =>
    (m.name || '').toLowerCase().includes(pickerSearch.toLowerCase())
  );
  const filteredColors = colorsList.filter(c =>
    (c || '').toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const isFormComplete = Boolean(selectedBrand && selectedModel && selectedColor);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Badge label="Service Finder" />
      <Text style={[styles.cardTitle, { color: colors.text }]}>Quick  Service Finder</Text>
      <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
        Select your device brand, model, color and connect with verified professionals near you.
      </Text>

      <View style={styles.selectRow}>
        <SelectField
          label="Brand"
          value={selectedBrand?.name}
          placeholder={loadingBrands ? 'Loading...' : brands.length ? 'Select Brand' : 'Not Found'}
          loading={loadingBrands}
          onPress={() => {
            setPickerSearch('');
            setPickerType('brand');
          }}
          style={styles.selectHalf}
        />
        <SelectField
          label="Model"
          value={selectedModel?.name}
          placeholder={
            !selectedBrand
              ? 'Select Brand'
              : loadingModels
                ? 'Loading...'
                : models.length
                  ? 'Select Model'
                  : 'Not Found'
          }
          disabled={!selectedBrand || loadingModels || !models.length}
          loading={loadingModels}
          onPress={() => {
            setPickerSearch('');
            setPickerType('model');
          }}
          style={styles.selectHalf}
        />
      </View>

      <SelectField
        label="Color"
        value={selectedColor || undefined}
        placeholder={
          !selectedModel
            ? 'Select Model First'
            : colorsList.length
              ? 'Select Color'
              : 'No Colors Available'
        }
        disabled={!selectedModel || !colorsList.length}
        onPress={() => {
          setPickerSearch('');
          setPickerType('color');
        }}
      />

      <Button
        title="Find Service"
        size="lg"
        disabled={!isFormComplete}
        onPress={handleFindService}
        style={[
          styles.findServiceButton,
          !isFormComplete && { opacity: 0.5 },
        ]}
      />

      {/* --- Picker Selection Modal --- */}
      <Modal
        visible={pickerType !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerType(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {pickerType === 'brand' && 'Select Device Brand'}
                {pickerType === 'model' && `Select ${selectedBrand?.name || ''} Model`}
                {pickerType === 'color' && `Select ${selectedModel?.name || ''} Color`}
              </Text>
              <TouchableOpacity
                onPress={() => setPickerType(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon source={closeIcon} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input for Brand / Model */}
            {(pickerType === 'brand' || pickerType === 'model') && (
              <View style={[styles.pickerSearchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Icon source={searchBold} size={16} color={colors.textMuted} />
                <TextInput
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                  placeholder={`Search ${pickerType}...`}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.pickerSearchInput, { color: colors.text }]}
                />
              </View>
            )}

            {/* List */}
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {pickerType === 'brand' && (
                filteredBrands.length === 0 ? (
                  <Text style={[styles.emptyListText, { color: colors.textMuted }]}>No brands found</Text>
                ) : (
                  filteredBrands.map(item => {
                    const isSelected = selectedBrand?._id === item._id;
                    return (
                      <TouchableOpacity
                        key={item._id}
                        activeOpacity={0.7}
                        onPress={() => handleBrandSelect(item)}
                        style={[
                          styles.pickerItem,
                          {
                            borderBottomColor: colors.border,
                            backgroundColor: isSelected ? colors.surfaceAlt : 'transparent',
                          },
                        ]}>
                        <View style={styles.pickerItemLeft}>
                          {item.icon?.startsWith('http') ? (
                            <Image
                              source={{ uri: item.icon }}
                              style={styles.pickerItemIcon}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={[styles.pickerIconPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                              <Icon source={mobileBold} size={18} color={colors.primary} />
                            </View>
                          )}
                          <Text style={[styles.pickerItemText, { color: colors.text, fontFamily: isSelected ? fonts.bold : fonts.medium }]}>
                            {item.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon source={checkCircleBold} size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )
              )}

              {pickerType === 'model' && (
                filteredModels.length === 0 ? (
                  <Text style={[styles.emptyListText, { color: colors.textMuted }]}>No models found</Text>
                ) : (
                  filteredModels.map(item => {
                    const isSelected = selectedModel?._id === item._id;
                    return (
                      <TouchableOpacity
                        key={item._id}
                        activeOpacity={0.7}
                        onPress={() => handleModelSelect(item)}
                        style={[
                          styles.pickerItem,
                          {
                            borderBottomColor: colors.border,
                            backgroundColor: isSelected ? colors.surfaceAlt : 'transparent',
                          },
                        ]}>
                        <View style={styles.pickerItemLeft}>
                          <View style={[styles.pickerIconPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                            <Icon source={desktopBold} size={18} color={colors.primary} />
                          </View>
                          <Text style={[styles.pickerItemText, { color: colors.text, fontFamily: isSelected ? fonts.bold : fonts.medium }]}>
                            {item.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon source={checkCircleBold} size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )
              )}

              {pickerType === 'color' && (
                filteredColors.length === 0 ? (
                  <Text style={[styles.emptyListText, { color: colors.textMuted }]}>No colors available</Text>
                ) : (
                  filteredColors.map((color, index) => {
                    const isSelected = selectedColor === color;
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        onPress={() => handleColorSelect(color)}
                        style={[
                          styles.pickerItem,
                          {
                            borderBottomColor: colors.border,
                            backgroundColor: isSelected ? colors.surfaceAlt : 'transparent',
                          },
                        ]}>
                        <View style={styles.pickerItemLeft}>
                          <View style={[styles.colorDotPreview, { backgroundColor: colors.primary }]}>
                            <Icon source={colorPaletteIcon} size={14} color="#FFF" />
                          </View>
                          <Text style={[styles.pickerItemText, { color: colors.text, fontFamily: isSelected ? fonts.bold : fonts.medium }]}>
                            {color}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon source={checkCircleBold} size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- Action Modal ("What do you want to do?") --- */}
      <Modal
        visible={showActionModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.actionModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.actionModalHeader}>
              <Text style={[styles.actionModalTitle, { color: colors.text }]}>What do you want to do?</Text>
              <Text style={[styles.actionModalSubtitle, { color: colors.textMuted }]}>
                {selectedBrand?.name} • {selectedModel?.name} • {selectedColor}
              </Text>
            </View>

            {/* Options */}
            <View style={styles.actionOptions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSearchRepairman}
                style={[styles.actionOptionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={styles.actionOptionLeft}>
                  <View style={[styles.actionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <Icon source={searchBold} size={22} color="#0284C7" />
                  </View>
                  <View style={styles.actionOptionTexts}>
                    <Text style={[styles.actionOptionTitle, { color: colors.text }]}>Search Repairman</Text>
                    <Text style={[styles.actionOptionDesc, { color: colors.textMuted }]}>
                      Find nearby verified technicians
                    </Text>
                  </View>
                </View>
                <Icon source={chevronRightBold} size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleHireRepairman}
                style={[styles.actionOptionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={styles.actionOptionLeft}>
                  <View style={[styles.actionIconWrap, { backgroundColor: '#FFEDD5' }]}>
                    <Icon source={plusSquareBold} size={22} color="#EA580C" />
                  </View>
                  <View style={styles.actionOptionTexts}>
                    <Text style={[styles.actionOptionTitle, { color: colors.text }]}>Hire a Repairman</Text>
                    <Text style={[styles.actionOptionDesc, { color: colors.textMuted }]}>
                      Let repairmen come to you
                    </Text>
                  </View>
                </View>
                <Icon source={chevronRightBold} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowActionModal(false)}
              style={[styles.actionCancelButton, { borderTopColor: colors.border }]}>
              <Text style={[styles.actionCancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  style = null,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  style?: any;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const displayValue = value || placeholder || 'Select';
  const isPlaceholder = !value;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.select,
        {
          borderColor: colors.border,
          backgroundColor: disabled ? colors.surfaceAlt : colors.surface,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}>
      <View style={styles.selectText}>
        <Text style={[styles.selectLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text
          numberOfLines={1}
          style={[
            styles.selectValue,
            { color: isPlaceholder ? colors.textMuted : colors.text },
          ]}>
          {displayValue}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Icon source={chevronDownBold} size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

function OurServices({ liveServices, navigation }: { liveServices?: any[]; navigation?: any }) {
  const { colors } = useTheme();
  if (!liveServices || liveServices.length === 0) return null;

  const servicesList = liveServices.map((s, idx) => ({
    id: s._id || String(idx),
    label: s.name || s.title || 'Service',
    icon: s.icon,
  }));

  const handleServicePress = (service: any) => {
    const label = (service.label || '').toLowerCase();
    if (label.includes('sell')) {
      navigation?.navigate('SellRefurbished');
    } else if (label.includes('accessori') || label.includes('refurbish')) {
      navigation?.navigate('BuyRefurbished');
    } else {
      // Repair / Tech service e.g. "Mobile Repairing", "Repair Laptop", "Panel", "Mother Board", "software"
      navigation?.navigate('ExpertRepairmen', { query: service.label });
    }
  };

  return (
    <View style={styles.section}>
      <Badge label="Our Services" />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Services</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.servicesRow}>
        {servicesList.map((service: any) => (
          <Squeeze key={service.id} onPress={() => handleServicePress(service)}>
            <View style={styles.serviceItem}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.surfaceAlt }]}>
                {service.icon?.startsWith('http') ? (
                  <Image source={{ uri: service.icon }} style={{ width: 30, height: 30, borderRadius: 6 }} resizeMode="contain" />
                ) : (
                  <Icon source={SERVICE_ICONS[service.label] || mobileBold} size={26} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.serviceLabel, { color: colors.text }]} numberOfLines={1}>
                {service.label}
              </Text>
            </View>
          </Squeeze>
        ))}
      </ScrollView>
    </View>
  );
}

function SpecialistCard({ repairman, navigation }: { repairman: any; navigation?: any }) {
  const { colors } = useTheme();
  const displayName =
    repairman.repairmanProfile?.fullName ||
    repairman.name ||
    repairman.repairmanProfile?.shopName ||
    'Verified Professional';

  const specialty =
    repairman.repairmanProfile?.specialization ||
    (Array.isArray(repairman.repairmanProfile?.specializations) && repairman.repairmanProfile.specializations[0]) ||
    (repairman.role && repairman.role !== 'repairman' ? repairman.role : 'Repair Specialist');

  const photo = repairman.photo || repairman.repairmanProfile?.profilePhoto || 'https://picsum.photos/seed/repairman/400/400';
  const location = repairman.shortLocation || repairman.city?.name || 'Lahore, Pakistan';
  const description = repairman.description || repairman.repairmanProfile?.description || 'Certified repair technician.';

  const handleOpenChat = async () => {
    const repairmanId = repairman._id || repairman.id;
    if (!repairmanId) {
      navigation?.navigate('ChatList');
      return;
    }
    try {
      const res = await startChat({ repairmanId });
      const targetName = res.chat?.user?.name || res.chat?.repairman?.name || displayName;
      const targetAvatar = res.chat?.user?.avatar || res.chat?.repairman?.avatar || photo;

      navigation?.navigate('ChatDetail', {
        chatId: res.chat?._id || res.chat?.chatId,
        participantId: repairmanId,
        participantName: targetName,
        participantAvatar: targetAvatar,
      });
    } catch {
      navigation?.navigate('ChatList');
    }
  };

  return (
    <View style={[styles.specialistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: photo }} style={styles.specialistImage} />

      <View style={styles.specialistBody}>
        <Text style={[styles.specialistName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
        <Text style={[styles.specialistRole, { color: colors.primary }]} numberOfLines={1}>{specialty}</Text>

        <View style={styles.metaRow}>
          <Icon source={mapPinBold} size={13} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {location}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.specialistDescription, { color: colors.textMuted }]} numberOfLines={3}>
          {description}
        </Text>

        <View style={styles.socialRow}>
          <Squeeze onPress={() => repairman.social?.facebook && Linking.openURL(repairman.social.facebook)} scale={0.85}>
            <Icon source={facebookIcon} size={22} />
          </Squeeze>
          <Squeeze onPress={() => repairman.social?.twitter && Linking.openURL(repairman.social.twitter)} scale={0.85}>
            <Icon source={twitterIcon} size={22} />
          </Squeeze>
          <Squeeze onPress={() => repairman.social?.linkedin && Linking.openURL(repairman.social.linkedin)} scale={0.85}>
            <Icon source={linkedinIcon} size={22} />
          </Squeeze>
        </View>

        <View style={styles.specialistActions}>
          <Button title="Book Appointment" onPress={handleOpenChat} style={styles.bookButton} />
          <Squeeze onPress={handleOpenChat} style={[styles.chatButton, { borderColor: colors.border }]}>
            <Icon source={commentDotsBold} size={20} color={colors.text} />
          </Squeeze>
        </View>
      </View>
    </View>
  );
}

function OurSpecialists({ liveRepairmen, navigation }: { liveRepairmen?: any[]; navigation?: any }) {
  const { colors } = useTheme();
  const list = liveRepairmen || [];
  if (list.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge label="Our Specialists" />
        <Squeeze onPress={() => navigation?.navigate('ExpertRepairmen')} scale={0.95}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.primary }}>
            View All →
          </Text>
        </Squeeze>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Meet Our Verified Professional</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
        Our certified repair experts bring years of hands-on experience and consistently high
        customer satisfaction.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.specialistsRow}>
        {list.map((repairman, idx) => (
          <SpecialistCard key={repairman._id || repairman.id || idx} repairman={repairman} navigation={navigation} />
        ))}
      </ScrollView>
    </View>
  );
}

function OurBlogs({ navigation, refreshing }: { navigation: any; refreshing?: boolean }) {
  const { colors } = useTheme();
  const [blogs, setBlogs] = useState<MobileBlog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await blogApi.getBlogs({ limit: 3 });
      if (Array.isArray(res)) {
        setBlogs(res);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs, refreshing]);

  if (loading && blogs.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Blogs</Text>
        <CtiLoader size="sm" text="Loading blogs..." style={{ paddingVertical: 20 }} />
      </View>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Blogs</Text>

      {blogs.map(post => (
        <Squeeze
          key={post.id}
          onPress={() => navigation.navigate('BlogDetail', { post, slug: post.slug })}
          style={[styles.blogCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {post.image ? <Image source={{ uri: post.image }} style={styles.blogImage} /> : null}
          <Text style={[styles.blogTitle, { color: colors.text }]}>{post.title}</Text>
          {post.description ? (
            <Text style={[styles.blogText, { color: colors.textMuted }]} numberOfLines={2}>
              {post.description}
            </Text>
          ) : null}
          <Text style={[styles.blogReadMore, { color: colors.error }]}>Readmore</Text>
        </Squeeze>
      ))}
    </View>
  );
}

function RatingsSlider({ liveReviews }: { liveReviews?: any[] }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  if (!liveReviews || liveReviews.length === 0) return null;

  const reviewsList = liveReviews.map((review, i) => ({
    id: review._id || String(i),
    photo: review.profilePhoto || 'https://picsum.photos/seed/customer/200/200',
    name: review.username || 'Verified Customer',
    text: review.reviewText || '',
    date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent',
  }));

  const onScrollEnd = (event: any) => {
    if (!width) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>What Our Customers Say</Text>

      <View style={styles.ratingsWrap} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}>
          {reviewsList.map(review => (
            <View key={review.id} style={{ width, paddingHorizontal: 6 }}>
              <View
                style={[
                  styles.reviewCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.reviewHead}>
                  <Image source={{ uri: review.photo }} style={styles.reviewAvatar} />
                  <Text style={[styles.specialistName, { color: colors.text }]}>{review.name}</Text>
                </View>
                <Text style={[styles.reviewText, { color: colors.textMuted }]}>{review.text}</Text>
                <View style={styles.reviewFoot}>
                  <Icon source={starExtra} size={16} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{review.date}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {reviewsList.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function StoreCard({ store, navigation }: { store: any; navigation?: any }) {
  const { colors } = useTheme();
  const name = store.name || store.businessName || 'Verified Store';
  const tagline = store.tagline || (store.productCategories?.[0] ?? 'Top Electronics Seller');
  const description = store.description || store.storeDescription || 'Official multi-category retailer.';
  const address = store.address || (store.city?.name ?? 'Pakistan');
  const image = store.image || store.profilePictureOrLogo || 'https://picsum.photos/seed/store/400/300';

  return (
    <View style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.storeImageWrap}>
        <Image source={{ uri: image }} style={styles.storeImage} />
        <View style={[styles.sponsoredBadge, { backgroundColor: colors.text }]}>
          <Text style={[styles.sponsoredBadgeText, { color: colors.background }]}>Sponsored</Text>
        </View>
      </View>

      <Text style={[styles.storeName, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.storeTagline, { color: colors.primary }]}>{tagline}</Text>
      <Text style={[styles.storeDescription, { color: colors.textMuted }]} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.metaRow}>
        <Icon source={mapPinBold} size={13} color={colors.textMuted} />
        <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
          {address}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          const sId = store.sellerId?._id || store.sellerId?.id || (typeof store.sellerId === 'string' ? store.sellerId : (store._id || store.id));
          navigation?.navigate('SellerStore', {
            sellerId: sId,
            sellerName: store.sellerId?.name || store.seller?.name || store.name,
            seller: store.sellerId || store.seller || store,
          });
        }}>
        <Text style={[styles.visitStore, { color: colors.primary }]}>Visit Store  →</Text>
      </TouchableOpacity>
    </View>
  );
}

function BestRatedStores({ liveSellers, navigation }: { liveSellers?: any[]; navigation?: any }) {
  const { colors } = useTheme();
  const storesList = liveSellers || [];
  if (storesList.length === 0) return null;

  return (
    <View style={styles.section}>
      <Badge label="Sponsored" />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Rated Stores</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
        Discover top-rated shops handpicked for you - quality guaranteed.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.storesRow}>
        {storesList.map((store: any, idx: number) => (
          <StoreCard key={store._id || store.id || idx} store={store} navigation={navigation} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await homeApi.getHomeData();
      if (data) setHomeData(data);
    } catch (e) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading home..."
            style={{ paddingVertical: 50 }}
          />
        ) : !homeData ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.text }}>
              Unable to load home content
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
              Please check your connection and pull down to refresh.
            </Text>
            <Button title="Retry" size="sm" onPress={loadData} style={{ marginTop: 16 }} />
          </View>
        ) : (
          <>
            <FadeUp duration={500}>
              <Hero banners={homeData?.banners} navigation={navigation} />
            </FadeUp>
            <FadeUp duration={500} delay={60}>
              <ServiceFinder navigation={navigation} />
            </FadeUp>
            <FadeUp duration={500} delay={100}>
              <OurServices liveServices={homeData?.services} navigation={navigation} />
            </FadeUp>
            <FadeUp duration={500} delay={140}>
              <OurSpecialists liveRepairmen={homeData?.repairmen} navigation={navigation} />
            </FadeUp>
            <FadeUp duration={500} delay={180}>
              <OurBlogs navigation={navigation} refreshing={refreshing} />
            </FadeUp>
            <FadeUp duration={500} delay={220}>
              <RatingsSlider liveReviews={homeData?.reviews} />
            </FadeUp>
            <FadeUp duration={500} delay={260}>
              <BestRatedStores liveSellers={homeData?.sellers} navigation={navigation} />
            </FadeUp>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 110, height: 59 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },

  body: { paddingHorizontal: 20 },
  // Lets horizontal sliders bleed to the screen edge while the rest of the
  // page keeps its 20px padding.
  bleed: { marginHorizontal: -20 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontFamily: fonts.regular, fontSize: 12 },

  section: { marginTop: 28 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 27, marginTop: 10 },
  sectionSubtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },

  heroWrap: { width: '100%' },
  heroDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  heroDot: { width: 7, height: 7, borderRadius: 4 },
  hero: { borderRadius: 16, padding: 18, marginTop: 18 },
  heroImage: { width: '100%', height: 170, borderRadius: 12 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
  },
  heroPillText: { fontFamily: fonts.medium, fontSize: 12 },
  heroTitle: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 29, marginTop: 12 },
  heroText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 8 },
  heroButton: { marginTop: 16 },

  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 20 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 19, marginTop: 12 },
  cardSubtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },

  selectRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  selectHalf: { flex: 1 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  selectText: { gap: 2 },
  selectLabel: { fontFamily: fonts.regular, fontSize: 11 },
  selectValue: { fontFamily: fonts.bold, fontSize: 14 },
  findServiceButton: { marginTop: 16 },

  servicesRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  serviceItem: { alignItems: 'center', gap: 8, width: 76 },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' },

  specialistsRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  specialistCard: { width: 260, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  specialistImage: { width: '100%', height: 150 },
  specialistBody: { padding: 14, gap: 4 },
  specialistName: { fontFamily: fonts.bold, fontSize: 16 },
  specialistRole: { fontFamily: fonts.regular, fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 12 },
  divider: { height: 1, marginVertical: 10 },
  specialistDescription: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  socialRow: { flexDirection: 'row', gap: 14, marginTop: 12 },
  specialistActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  bookButton: { flex: 1 },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  statCard: { width: '47%', borderRadius: 14, padding: 14, gap: 8 },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 18 },
  statLabel: { fontFamily: fonts.regular, fontSize: 12 },

  blogCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 14 },
  blogImage: { width: '100%', height: 130, borderRadius: 10 },
  blogTitle: { fontFamily: fonts.bold, fontSize: 16, marginTop: 12 },
  blogText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },
  blogReadMore: { fontFamily: fonts.bold, fontSize: 13, marginTop: 8 },

  faqTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  faqTab: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  faqTabText: { fontFamily: fonts.medium, fontSize: 12 },
  faqList: { gap: 10, marginTop: 14 },
  faqItem: { borderWidth: 1, borderRadius: 12, padding: 14 },
  faqQuestionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  faqQuestion: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  chevronFlipped: { transform: [{ rotate: '180deg' }] },
  faqAnswer: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 10 },

  questionCta: { borderRadius: 16, padding: 20, marginTop: 18 },
  questionCtaTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' },
  questionCtaText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: '#FFFFFF', marginTop: 8 },
  questionCtaButton: { alignSelf: 'flex-start', marginTop: 16 },

  reviewCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  ratingsWrap: { marginTop: 16 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 12 },
  reviewFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  productsRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  productCard: { width: 170, borderRadius: 14, borderWidth: 1, padding: 12 },
  productHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productLogo: { width: 70, height: 38 },
  adBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adBadgeText: { fontFamily: fonts.bold, fontSize: 9 },
  productImage: { width: '100%', height: 100, borderRadius: 10, marginTop: 8 },
  productName: { fontFamily: fonts.bold, fontSize: 13, marginTop: 10 },
  productDescription: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, marginTop: 4 },
  productRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  productPrice: { fontFamily: fonts.bold, fontSize: 15, marginTop: 6 },

  storesRow: { gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  storeCard: { width: 280, borderRadius: 16, borderWidth: 1, padding: 14 },
  storeImageWrap: { borderRadius: 12, overflow: 'hidden' },
  storeImage: { width: '100%', height: 140 },
  sponsoredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sponsoredBadgeText: { fontFamily: fonts.medium, fontSize: 11 },
  storeName: { fontFamily: fonts.bold, fontSize: 16, marginTop: 12 },
  storeTagline: { fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
  storeDescription: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 6 },
  visitStore: { fontFamily: fonts.bold, fontSize: 13, marginTop: 12 },

  // --- Picker & Action Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 16 },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  pickerSearchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 0,
  },
  pickerList: {
    paddingHorizontal: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pickerItemIcon: {
    width: 24,
    height: 24,
  },
  pickerIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotPreview: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 14,
    flex: 1,
  },
  emptyListText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  actionModalContent: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  actionModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: 'center',
  },
  actionModalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  actionModalSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  actionOptions: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  actionOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOptionTexts: {
    flex: 1,
    gap: 2,
  },
  actionOptionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  actionOptionDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  actionCancelButton: {
    borderTopWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionCancelText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#FFFFFF',
  },
});
