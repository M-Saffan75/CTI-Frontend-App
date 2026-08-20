import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import Button from '@/components/Button';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleIcon,
  heartExtra,
  shieldBold,
  shoppingCartExtra,
  starExtra,
  stopwatchBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { PRINCIPLES, PROMISES, STATS, TEAM, TIMELINE } from '../data/about';

const PROMISE_ICONS = [starExtra, shieldBold, checkCircleIcon, stopwatchBold];

export default function AboutScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <View>
            <Icon source={heartExtra} size={24} color={colors.text} />
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
          <Icon source={shoppingCartExtra} size={24} color={colors.text} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        {/* Reuse & Reduce */}
        <FadeUp delay={80} duration={600}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/cti-about-hero/900/600' }}
            style={styles.hero}
          />
          <Text style={[styles.label, { color: colors.primary }]}>Sustainability & Innovation</Text>
          <Text style={[styles.heading, { color: colors.text }]}>Reuse & Reduce</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Our grandparents lived a sustainable life - long before sustainability was even a
            concept.
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Let's mindfully bring sustainable choices back into our modern lifestyle, starting with
            technology for a better future.
          </Text>
        </FadeUp>

        {/* Building a world */}
        <FadeUp delay={140} duration={600}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/cti-about-world/900/600' }}
            style={styles.block}
          />
          <Text style={[styles.label, { color: colors.primary }]}>Sustainability & Innovation</Text>
          <Text style={[styles.heading, { color: colors.text }]}>
            Building a world where tech doesn't need to cost the pocket or the planet.
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            To change the lifecycle of every gadget by redefining what we choose to do with it.
          </Text>
        </FadeUp>

        {/* Our Promise */}
        <FadeUp delay={200} duration={600}>
          <Text style={[styles.centerLabel, { color: colors.primary }]}>Our commitment</Text>
          <Text style={[styles.centerHeading, { color: colors.text }]}>Our Promise</Text>
          <Text style={[styles.centerText, { color: colors.textMuted }]}>
            We promise to make sustainable technology accessible, affordable, and effortless for
            everyone.
          </Text>

          <View style={styles.cards}>
            {PROMISES.map((promise, index) => (
              <View
                key={promise.title}
                style={[styles.promise, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.promiseBar, { backgroundColor: colors.primary }]} />
                <Icon source={PROMISE_ICONS[index]} size={22} color={colors.primary} />
                <View style={styles.promiseText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{promise.title}</Text>
                  <Text style={[styles.cardText, { color: colors.textMuted }]}>{promise.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* Our passion */}
        <FadeUp delay={260} duration={600}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/cti-about-passion/900/600' }}
            style={styles.block}
          />
          <Text style={[styles.label, { color: colors.primary }]}>Our passion</Text>
          <Text style={[styles.heading, { color: colors.text }]}>
            Adding right way to business for the planet and the people who live on it.
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            To change the lifecycle of every gadget by redefining what we choose to do with it.
          </Text>
        </FadeUp>

        {/* From Zero to Hero */}
        <FadeUp delay={320} duration={600}>
          <View style={[styles.journeyBadge, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.journeyBadgeText, { color: colors.textMuted }]}>OUR JOURNEY</Text>
          </View>

          <View style={[styles.journey, { backgroundColor: colors.primary }]}>
            <Text style={styles.journeyTitle}>From Zero to Hero</Text>
            <Text style={styles.journeyText}>
              A journey of innovation, sustainability, and commitment to changing how the world
              thinks about technology.
            </Text>
          </View>

          <View style={[styles.milestone, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.milestoneYear, { color: colors.text }]}>{TIMELINE[0].year}</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{TIMELINE[0].title}</Text>
            <Text style={[styles.cardText, { color: colors.textMuted }]}>
              We founded our company with a simple vision: to make technology accessible to
              everyone. Starting with a small team of passionate individuals, we began collecting
              and refurbishing old devices.
            </Text>
            <Button
              title="The Beginning"
              size="sm"
              fullWidth={false}
              style={styles.milestoneButton}
            />
          </View>

          {TIMELINE.map((item, index) => (
            <View
              key={item.year}
              style={[
                styles.timelineRow,
                {
                  backgroundColor: index === 0 ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.timelineYear,
                  { color: index === 0 ? colors.onPrimary : colors.textMuted },
                ]}>
                {item.year}
              </Text>
              <View style={styles.timelineText}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: index === 0 ? colors.onPrimary : colors.text },
                  ]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.cardText,
                    { color: index === 0 ? colors.onPrimary : colors.textMuted },
                  ]}>
                  {item.text}
                </Text>
              </View>
            </View>
          ))}
        </FadeUp>

        {/* Our Principles */}
        <FadeUp delay={380} duration={600}>
          <Text style={[styles.centerLabel, { color: colors.primary }]}>Our Foundation</Text>
          <Text style={[styles.centerHeading, { color: colors.text }]}>Our Principles</Text>
          <Text style={[styles.centerText, { color: colors.textMuted }]}>
            These core values guide every decision we make and shape our vision for the future.
          </Text>

          <View style={styles.cards}>
            {PRINCIPLES.map(principle => (
              <View
                key={principle.number}
                style={[styles.principle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.principleNumber, { color: colors.primary + '4D' }]}>
                  {principle.number}
                </Text>
                <View style={styles.promiseText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{principle.title}</Text>
                  <Text style={[styles.cardText, { color: colors.textMuted }]}>
                    {principle.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* Impact stats */}
        {STATS.map((stat, index) => (
          <FadeUp key={index} delay={440 + index * 60} duration={600}>
            <Text style={[styles.statHeading, { color: colors.text }]}>
              {stat.before}
              <Text style={{ color: colors.primary }}>{stat.highlight}</Text>
              {stat.after}
            </Text>
            {stat.text && (
              <Text style={[styles.centerText, { color: colors.textMuted }]}>{stat.text}</Text>
            )}
            <Image source={{ uri: stat.image }} style={styles.block} />
          </FadeUp>
        ))}

        {/* Team */}
        <FadeUp delay={640} duration={600}>
          <Text style={[styles.centerHeading, { color: colors.text }]}>Meet Our Team</Text>
          <Text style={[styles.centerText, { color: colors.textMuted }]}>
            A diverse group of professionals inspired by real-world product and engineering teams.
          </Text>

          {/* More members than fit on screen, so this one scrolls sideways.
              The negative margin lets cards run to the screen edge while the
              rest of the page keeps its 20px padding. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.team}
            style={styles.teamScroll}>
            {TEAM.map(member => (
              <View key={member.name} style={styles.member}>
                <Image source={{ uri: member.photo }} style={styles.memberPhoto} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{member.name}</Text>
                <Text style={[styles.cardText, { color: colors.textMuted }]}>{member.role}</Text>
              </View>
            ))}
          </ScrollView>
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
    paddingBottom: 6,
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

  body: { paddingHorizontal: 20, paddingTop: 6 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  hero: { width: '100%', height: 190, borderRadius: 14, marginTop: 16 },
  block: { width: '100%', height: 190, borderRadius: 14, marginTop: 20 },

  label: { fontFamily: fonts.regular, fontSize: 12, marginTop: 18 },
  heading: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, marginTop: 8 },
  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, marginTop: 12 },

  centerLabel: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', marginTop: 36 },
  centerHeading: {
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  centerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },

  cards: { gap: 12, marginTop: 20 },
  promise: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  promiseBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  promiseText: { flex: 1, gap: 6 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  cardText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },

  journeyBadge: {
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 34,
  },
  journeyBadgeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 },
  journey: { borderRadius: 12, padding: 20, alignItems: 'center', gap: 10, marginTop: 14 },
  journeyTitle: { fontFamily: fonts.bold, fontSize: 20, color: '#FFFFFF' },
  journeyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },

  milestone: { borderRadius: 12, padding: 18, gap: 10, marginTop: 20 },
  milestoneYear: { fontFamily: fonts.bold, fontSize: 30 },
  milestoneButton: { alignSelf: 'flex-start', marginTop: 4 },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
  },
  timelineYear: { fontFamily: fonts.bold, fontSize: 16, width: 48 },
  timelineText: { flex: 1, gap: 3 },

  principle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  principleNumber: { fontFamily: fonts.bold, fontSize: 26 },

  statHeading: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    marginTop: 40,
  },

  teamScroll: { marginHorizontal: -20, marginTop: 20 },
  team: { gap: 14, paddingHorizontal: 20 },
  member: { width: 155, gap: 6 },
  memberPhoto: { width: '100%', height: 150, borderRadius: 12, marginBottom: 4 },
});
