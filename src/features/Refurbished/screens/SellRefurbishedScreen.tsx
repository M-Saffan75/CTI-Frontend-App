import { useState } from 'react';
import {
  Dimensions,
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
import {
  arrowRightBold,
  calendarBold,
  checkCircleBold,
  creditCardBold,
  fileBold,
  packageBold,
  searchBold,
  shieldBold,
  starBold,
  tagBold,
} from '@/assets/icons';
import { demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import {
  HOW_IT_WORKS_STEPS,
  REFURBISHED_TESTIMONIALS,
  WHY_SELL_WITH_US,
} from '../data/refurbishedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPULAR_BRANDS = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus'];

export default function SellRefurbishedScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Apple');

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    navigation.navigate('SelectModel', { brand });
  };

  const renderWhyUsIcon = (type: string) => {
    switch (type) {
      case 'tag':
        return <Icon source={tagBold} size={22} color={colors.primary} />;
      case 'card':
        return <Icon source={creditCardBold} size={22} color={colors.primary} />;
      case 'sparkle':
        return <Icon source={starBold} size={22} color={colors.primary} />;
      case 'truck':
        return <Icon source={packageBold} size={22} color={colors.primary} />;
      case 'shield':
        return <Icon source={shieldBold} size={22} color={colors.primary} />;
      case 'invoice':
        return <Icon source={fileBold} size={22} color={colors.primary} />;
      default:
        return <Icon source={checkCircleBold} size={22} color={colors.primary} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader
        showBack={false}
        onCartPress={() => {
          try {
            navigation.navigate('Cart');
          } catch {}
        }}
        onWishlistPress={() => {
          try {
            navigation.navigate('Wishlist');
          } catch {}
        }}
        onMenuPress={() => {
          try {
            navigation.navigate('Settings');
          } catch {}
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
          ]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search order custom product"
            placeholderTextColor={colors.textMuted + '88'}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Hero Promotional Banner with Warm Amber Gradient */}
        <FadeUp delay={60}>
          <View style={styles.heroBanner}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroHeadline}>
                Sell Your Sell Phone for Instant Cash
              </Text>
              <Text style={styles.heroSub}>
                Get real-time device valuation & guaranteed doorstep pickup within 24h.
              </Text>
              <Squeeze
                onPress={() => handleBrandSelect(selectedBrand)}
                style={styles.heroActionBtn}>
                <View style={styles.heroActionRow}>
                  <Text style={styles.heroActionBtnText}>Sell Now</Text>
                  <Icon source={arrowRightBold} size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              </Squeeze>
            </View>

            <Image
              source={demoProductPhoto}
              style={styles.heroPhoneImage}
              resizeMode="contain"
            />
          </View>
        </FadeUp>

        {/* Trust Badges matching Figma */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trustBadgesRow}>
          <View
            style={[
              styles.trustBadge,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={checkCircleBold} size={14} color={colors.primary} />
            <Text style={[styles.trustBadgeText, { color: colors.text }]}>
              Free Doorstep Pickup
            </Text>
          </View>

          <View
            style={[
              styles.trustBadge,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={checkCircleBold} size={14} color={colors.primary} />
            <Text style={[styles.trustBadgeText, { color: colors.text }]}>Maximum Value</Text>
          </View>

          <View
            style={[
              styles.trustBadge,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={packageBold} size={14} color={colors.primary} />
            <Text style={[styles.trustBadgeText, { color: colors.text }]}>
              Safe & Hassle-Free
            </Text>
          </View>
        </ScrollView>

        {/* OR CHOOSE A BRAND Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border + '44' }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>
            OR CHOOSE A BRAND
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border + '44' }]} />
        </View>

        {/* Brand Selector matching Figma */}
        <View style={styles.brandsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScroll}>
            {POPULAR_BRANDS.map(brand => {
              const active = selectedBrand === brand;
              return (
                <TouchableOpacity
                  key={brand}
                  onPress={() => handleBrandSelect(brand)}
                  style={[
                    styles.brandSelectBtn,
                    {
                      backgroundColor: active ? colors.primary + '18' : colors.surfaceAlt,
                      borderColor: active ? colors.primary : colors.border + '44',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.brandSelectText,
                      { color: active ? colors.primary : colors.text },
                    ]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => navigation.navigate('SelectModel', { brand: 'All' })}
              style={[
                styles.brandSelectBtn,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '44' },
              ]}>
              <Text style={[styles.brandSelectText, { color: colors.primary }]}>More Brands</Text>
              <Icon
                source={arrowRightBold}
                size={12}
                color={colors.primary}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* How It Works Section matching Figma */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>How It Works</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.howItWorksScroll}>
            {(HOW_IT_WORKS_STEPS || []).map(step => (
              <View
                key={step.step}
                style={[
                  styles.stepCard,
                  { backgroundColor: colors.surface, borderColor: colors.border + '44' },
                ]}>
                <View
                  style={[
                    styles.stepIconCircle,
                    { backgroundColor: colors.primary + '18' },
                  ]}>
                  <Icon source={calendarBold} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                  {step.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Why Us Section matching Figma */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Why Us</Text>

          <View style={styles.whyUsList}>
            {(WHY_SELL_WITH_US || []).map((item, idx) => (
              <FadeUp key={item.id} delay={idx * 40}>
                <View
                  style={[
                    styles.whyUsCard,
                    { backgroundColor: colors.surface, borderColor: colors.border + '44' },
                  ]}>
                  <View
                    style={[
                      styles.whyUsIconBox,
                      { backgroundColor: colors.primary + '14' },
                    ]}>
                    {renderWhyUsIcon(item.iconType)}
                  </View>
                  <View style={styles.whyUsInfo}>
                    <Text style={[styles.whyUsTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.whyUsDesc, { color: colors.textMuted }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              </FadeUp>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Customer Reviews</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.testimonialsScroll}>
            {(REFURBISHED_TESTIMONIALS || []).map(t => (
              <View
                key={t?.id}
                style={[
                  styles.testimonialCard,
                  { backgroundColor: colors.surface, borderColor: colors.border + '33' },
                ]}>
                <Text style={[styles.quoteMark, { color: colors.primary }]}>“</Text>
                <Text style={[styles.testimonialFeedback, { color: colors.text }]}>
                  {t?.feedback || ''}
                </Text>
                <View style={styles.testimonialUserRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {t?.name ? t.name.charAt(0) : 'U'}
                    </Text>
                  </View>
                  <Text style={[styles.testimonialUserName, { color: colors.text }]}>
                    {t?.name || 'Customer'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    padding: 0,
  },
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 180,
    overflow: 'hidden',
  },
  heroTextCol: {
    flex: 1.2,
    zIndex: 2,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: fonts.bold,
    lineHeight: 28,
  },
  heroSub: {
    color: '#FEF3C7',
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 14,
  },
  heroActionBtn: {
    backgroundColor: '#B45309',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  heroPhoneImage: {
    width: 110,
    height: 140,
    marginLeft: 10,
  },
  trustBadgesRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  trustBadgeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },
  brandsWrapper: {
    marginBottom: 24,
  },
  brandsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  brandSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  brandSelectText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  sectionBlock: {
    marginTop: 10,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: fonts.bold,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  howItWorksScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  stepCard: {
    width: SCREEN_WIDTH * 0.62,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  whyUsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  whyUsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  whyUsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyUsInfo: {
    flex: 1,
  },
  whyUsTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  whyUsDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 17,
  },
  testimonialsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  testimonialCard: {
    width: SCREEN_WIDTH * 0.72,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  quoteMark: {
    fontSize: 32,
    fontFamily: fonts.bold,
    lineHeight: 32,
  },
  testimonialFeedback: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginVertical: 8,
  },
  testimonialUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  testimonialUserName: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
