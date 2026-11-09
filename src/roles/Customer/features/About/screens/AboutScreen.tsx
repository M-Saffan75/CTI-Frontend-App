import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleBold,
  heartBold,
  shieldBold,
  shoppingBasketBold,
  starBold,
  stopwatchBold,
} from '@/assets/icons';
import { aboutImages, ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import {
  PRINCIPLES,
  PROMISES,
  SOLUTION_STATS,
  TIMELINE,
  WASTE_POINTS,
} from '../data/about';

const PROMISE_ICONS = [starBold, shieldBold, checkCircleBold, stopwatchBold];

export default function AboutScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds } = useWishlist();
  const [activeYearIndex, setActiveYearIndex] = useState(0);

  const activeMilestone = TIMELINE[activeYearIndex] || TIMELINE[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Wishlist')} scale={0.85}>
            <View>
              <Icon source={heartBold} size={24} color={colors.text} />
              {wishlistIds.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{wishlistIds.length}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <Icon source={shoppingBasketBold} size={24} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        {/* Section 1 - Hero (Reuse & Reduce) */}
        <FadeUp delay={60} duration={500}>
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.heroTag}>SUSTAINABILITY & INNOVATION</Text>
            <Text style={styles.heroHeading}>Reuse & Reduce</Text>
            <Text style={styles.heroSubtitle}>
              Our grandparents lived a sustainable life — long before sustainability was even a concept.
            </Text>
            <Text style={styles.heroBody}>
              Let's mindfully bring sustainable choices back into our modern lifestyle, starting with
              technology for a better future.
            </Text>
            <Image source={aboutImages.hero} style={styles.cardImage} resizeMode="cover" />
          </View>
        </FadeUp>

        {/* Marquee Banner */}
        <View style={[styles.marqueeContainer, { backgroundColor: isDark ? colors.surfaceAlt : colors.surface, borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[styles.marqueeText, { color: colors.text }]}>
              BUY. REPAIR. SELL. REFURBISH. REUSE. REPEAT. • BUY. REPAIR. SELL. REFURBISH. REUSE. REPEAT.
            </Text>
          </ScrollView>
        </View>

        {/* Section 2 - Our Passion 1 */}
        <FadeUp delay={120} duration={500}>
          <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.tag, { color: colors.primary }]}>OUR PASSION</Text>
            <Text style={[styles.heading, { color: colors.text }]}>
              Building a world where tech doesn't need to cost the pocket or the planet.
            </Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>
              To change the lifecycle of every gadget by redefining what we choose to do with it.
            </Text>
            <Image source={aboutImages.passion1} style={styles.cardImage} resizeMode="cover" />
          </View>
        </FadeUp>

        {/* Section 3 - Our Promise */}
        <FadeUp delay={180} duration={500}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.centerTag, { color: colors.primary }]}>OUR COMMITMENT</Text>
            <Text style={[styles.centerHeading, { color: colors.text }]}>Our Promise</Text>
            <Text style={[styles.centerText, { color: colors.textMuted }]}>
              We promise to make sustainable technology accessible, affordable, and effortless for everyone.
            </Text>
          </View>

          <View style={styles.cardsGrid}>
            {PROMISES.map((promise, index) => (
              <View
                key={promise.title}
                style={[
                  styles.promiseCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={[styles.iconBubble, { backgroundColor: colors.primary + '18' }]}>
                  <Icon source={PROMISE_ICONS[index]} size={20} color={colors.primary} />
                </View>
                <View style={styles.promiseContent}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{promise.title}</Text>
                  <Text style={[styles.cardText, { color: colors.textMuted }]}>{promise.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* Section 4 - Our Passion 2 */}
        <FadeUp delay={240} duration={500}>
          <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.tag, { color: colors.primary }]}>OUR PASSION</Text>
            <Text style={[styles.heading, { color: colors.text }]}>
              Adding “right way” to business for the planet and the people who live on it.
            </Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>
              To change the lifecycle of every gadget by redefining what we choose to do with it.
            </Text>
            <Image source={aboutImages.passion2} style={styles.cardImage} resizeMode="cover" />
          </View>
        </FadeUp>

        {/* Section 5 - History Stepper */}
        <FadeUp delay={300} duration={500}>
          <View style={[styles.journeyHeader, { backgroundColor: colors.primary }]}>
            <Text style={styles.journeyBadge}>OUR STORY</Text>
            <Text style={styles.journeyTitle}>From Zero to Hero</Text>
            <Text style={styles.journeySub}>
              A journey of innovation, sustainability, and commitment to changing how the world thinks about technology.
            </Text>
          </View>

          {/* Stepper Year Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearScroll}>
            {TIMELINE.map((item, index) => {
              const isActive = index === activeYearIndex;
              return (
                <Squeeze
                  key={item.year}
                  onPress={() => setActiveYearIndex(index)}
                  scale={0.95}>
                  <View
                    style={[
                      styles.yearPill,
                      {
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.yearPillText,
                        { color: isActive ? colors.onPrimary : colors.text },
                      ]}>
                      {item.year}
                    </Text>
                  </View>
                </Squeeze>
              );
            })}
          </ScrollView>

          {/* Active Milestone Card */}
          <View
            style={[
              styles.milestoneCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.milestoneTopRow}>
              <Text style={[styles.milestoneYear, { color: colors.primary }]}>
                {activeMilestone.year}
              </Text>
              <View style={styles.milestoneBadges}>
                <View style={[styles.milestoneHighlight, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.milestoneHighlightText, { color: colors.primary }]}>
                    {activeMilestone.highlight}
                  </Text>
                </View>
                <View style={[styles.milestoneStats, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.milestoneStatsText, { color: colors.textMuted }]}>
                    {activeMilestone.stats}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.milestoneTitle, { color: colors.text }]}>
              {activeMilestone.title}
            </Text>
            <Text style={[styles.milestoneDesc, { color: colors.textMuted }]}>
              {activeMilestone.description}
            </Text>
          </View>
        </FadeUp>

        {/* Section 6 - Our Principles */}
        <FadeUp delay={360} duration={500}>
          <View style={[styles.principlesContainer, { backgroundColor: isDark ? colors.surface : '#111827' }]}>
            <Text style={[styles.centerTag, { color: '#34D399' }]}>OUR FOUNDATION</Text>
            <Text style={[styles.centerHeading, { color: '#FFFFFF' }]}>Our Principles</Text>
            <Text style={[styles.centerText, { color: '#9CA3AF' }]}>
              These core values guide every decision we make and shape our vision for the future.
            </Text>

            <View style={styles.principlesGrid}>
              {PRINCIPLES.map(principle => (
                <View key={principle.number} style={styles.principleRow}>
                  <View style={styles.principleBadge}>
                    <Text style={styles.principleNumber}>{principle.number}</Text>
                  </View>
                  <View style={styles.principleContent}>
                    <Text style={styles.principleTitle}>{principle.title}</Text>
                    <Text style={styles.principleText}>{principle.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </FadeUp>

        {/* Section 7 - Solution Section */}
        <FadeUp delay={420} duration={500}>
          <View style={styles.solutionHeader}>
            <View style={[styles.solutionTagWrap, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.solutionTag, { color: colors.primary }]}>REUSE & IMPACT</Text>
            </View>
            <Text style={[styles.solutionHeading, { color: colors.text }]}>
              Be a part of <Text style={{ color: colors.primary }}>Solution</Text>, not Pollution
            </Text>
            <Text style={[styles.solutionSub, { color: colors.textMuted }]}>
              When you reuse just one phone:
            </Text>
          </View>

          {/* Water Card */}
          <View
            style={[
              styles.impactCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.impactCardHeader}>
              <View style={[styles.impactPill, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.impactPillText, { color: '#0284C7' }]}>WATER</Text>
              </View>
              <Text style={[styles.impactSaveLabel, { color: colors.textMuted }]}>YOU SAVE</Text>
              <View style={styles.impactNumberRow}>
                <Text style={[styles.impactBigNum, { color: colors.primary }]}>909</Text>
                <Text style={[styles.impactUnit, { color: colors.text }]}>liters</Text>
              </View>
              <Text style={[styles.impactCardTitle, { color: colors.text }]}>of water</Text>
              <Text style={[styles.impactCardDesc, { color: colors.textMuted }]}>
                & save people from staying thirsty for 100 years.
              </Text>
            </View>
            <Image source={aboutImages.water} style={styles.impactImage} resizeMode="contain" />
          </View>

          {/* Energy Card */}
          <View
            style={[
              styles.impactCard,
              { backgroundColor: isDark ? colors.surface : '#1E293B', borderColor: colors.border },
            ]}>
            <View style={styles.impactCardHeader}>
              <View style={[styles.impactPill, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.impactPillText, { color: '#D97706' }]}>ENERGY</Text>
              </View>
              <Text style={[styles.impactSaveLabel, { color: '#94A3B8' }]}>YOU SAVE</Text>
              <View style={styles.impactNumberRow}>
                <Text style={[styles.impactBigNum, { color: '#FBBF24' }]}>72</Text>
                <Text style={[styles.impactUnit, { color: '#FFFFFF' }]}>kWh</Text>
              </View>
              <Text style={[styles.impactCardTitle, { color: '#FFFFFF' }]}>of energy</Text>
              <Text style={[styles.impactCardDesc, { color: '#CBD5E1' }]}>
                & power homes for weeks.
              </Text>
            </View>
            <Image source={aboutImages.energy} style={styles.impactImage} resizeMode="contain" />
          </View>

          {/* E-Waste Card */}
          <View
            style={[
              styles.impactCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.impactCardHeader}>
              <View style={[styles.impactPill, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.impactPillText, { color: '#16A34A' }]}>PLANET</Text>
              </View>
              <Text style={[styles.wasteCardTitle, { color: colors.text }]}>
                You keep <Text style={{ color: colors.primary }}>toxic e-waste</Text> out of landfills & protect our planet
              </Text>
              <Text style={[styles.impactCardDesc, { color: colors.textMuted }]}>
                Every phone reused prevents toxic waste from polluting our environment and conserves precious natural resources for future generations.
              </Text>
              <View style={styles.wastePillsRow}>
                {WASTE_POINTS.map(point => (
                  <View
                    key={point}
                    style={[styles.wastePointPill, { backgroundColor: colors.surfaceAlt }]}>
                    <Icon source={checkCircleBold} size={14} color={colors.primary} />
                    <Text style={[styles.wastePointText, { color: colors.text }]}>{point}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Image source={aboutImages.waste} style={styles.impactImage} resizeMode="contain" />
          </View>

          {/* Stats Strip */}
          <View
            style={[
              styles.statsStrip,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            {SOLUTION_STATS.map((stat, idx) => (
              <View
                key={stat.label}
                style={[
                  styles.statStripItem,
                  idx < SOLUTION_STATS.length - 1 && [styles.statDivider, { borderRightColor: colors.border }],
                ]}>
                <Text style={[styles.statStripValue, { color: colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statStripLabel, { color: colors.textMuted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </FadeUp>
      </ScrollView>
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
    paddingBottom: 8,
  },
  logo: { width: 110, height: 48 },
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

  body: { paddingHorizontal: 16, paddingTop: 8 },
  backWrap: { alignSelf: 'flex-start', marginBottom: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Hero Card
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroTag: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#FFFFFFCC',
    marginBottom: 8,
  },
  heroHeading: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFFEE',
    marginBottom: 8,
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: '#FFFFFFDD',
    marginBottom: 16,
  },

  // Marquee
  marqueeContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  marqueeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.5,
  },

  // Content Card
  contentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  tag: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 8,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },

  // Promise section
  sectionHeader: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  centerTag: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  centerHeading: {
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  centerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  cardsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  promiseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseContent: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  cardText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },

  // Journey
  journeyHeader: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  journeyBadge: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#FFFFFFB3',
  },
  journeyTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  journeySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: '#FFFFFFAA',
  },
  yearScroll: {
    gap: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  yearPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  yearPillText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  milestoneCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  milestoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  milestoneYear: {
    fontFamily: fonts.bold,
    fontSize: 28,
  },
  milestoneBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  milestoneHighlight: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  milestoneHighlightText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  milestoneStats: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  milestoneStatsText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  milestoneTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginBottom: 6,
  },
  milestoneDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },

  // Principles
  principlesContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  principlesGrid: {
    gap: 16,
    marginTop: 16,
  },
  principleRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  principleBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34D3991A',
  },
  principleNumber: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#34D399',
  },
  principleContent: {
    flex: 1,
    gap: 4,
  },
  principleTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  principleText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#9CA3AF',
  },

  // Solution
  solutionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  solutionTagWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  solutionTag: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  solutionHeading: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 6,
  },
  solutionSub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },

  // Impact Card
  impactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  impactCardHeader: {
    marginBottom: 12,
  },
  impactPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  impactPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  impactSaveLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 2,
  },
  impactNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  impactBigNum: {
    fontFamily: fonts.bold,
    fontSize: 48,
    lineHeight: 52,
  },
  impactUnit: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginBottom: 8,
  },
  impactCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    marginBottom: 4,
  },
  impactCardDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  wasteCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  wastePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  wastePointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  wastePointText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  impactImage: {
    width: '100%',
    height: 160,
    marginTop: 8,
  },

  // Stats Strip
  statsStrip: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  statStripItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statDivider: {
    borderRightWidth: 1,
  },
  statStripValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  statStripLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: 'center',
  },
});
