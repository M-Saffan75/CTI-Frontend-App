import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, searchBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { gradients } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { CATEGORIES, FEATURED_CATEGORIES } from '../data/courses';

const HALF = Math.ceil(CATEGORIES.length / 2);
const PILL_ROWS = [CATEGORIES.slice(0, HALF), CATEGORIES.slice(HALF)];

const PITCH =
  'Hundreds of different types of training courses, enriched with AI-powered content, await you at Trendyol Academy! Easily access all the information you need, anytime and anywhere, and take your business to the next level with personalized experiences tailored to your needs.';

export default function AcademyScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const openCourses = category => navigation.navigate('Courses', { category });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <View style={[styles.search, { borderColor: colors.border }]}>
          <Icon source={searchBold} size={20} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Courses"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <FadeUp delay={100} duration={600}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/cti-academy-hero/900/600' }}
            style={[styles.hero, { backgroundColor: colors.primary }]}
          />

          <Text style={[styles.heading, { color: colors.text }]}>
            <Text style={{ color: colors.primary }}>Integrate</Text> Academy is here for you!
          </Text>
          <Text style={[styles.subheading, { color: colors.text }]}>
            Hundreds of training courses!
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>{PITCH}</Text>

          <View style={styles.ctaRow}>
            <Button title="Place Order Securely" size="md" fullWidth={false} style={styles.cta} />
            <Button
              title="Place Order Securely"
              size="md"
              fullWidth={false}
              color="#101828"
              style={styles.cta}
            />
          </View>
        </FadeUp>

        <FadeUp delay={180} duration={600}>
          <Text style={[styles.centerHeading, { color: colors.text }]}>
            Master the Skills{'\n'}You Need
          </Text>
          <Text style={[styles.centerText, { color: colors.textMuted }]}>
            Explore our comprehensive course catalog
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.featuredScroll}
            contentContainerStyle={styles.featuredRow}>
            {FEATURED_CATEGORIES.map(item => (
              // These three have no courses in the demo data, so they open the
              // full list until the API provides them.
              <Squeeze key={item.id} onPress={() => openCourses(null)}>
                <LinearGradient
                  colors={gradients[item.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.featured}>
                  <Text style={styles.featuredText}>{item.label}</Text>
                </LinearGradient>
              </Squeeze>
            ))}
          </ScrollView>

          {/* Two rows that scroll sideways, as in the design — not a wrapping
              grid. The pills run off the right edge on purpose. */}
          {PILL_ROWS.map((row, index) => (
            <ScrollView
              key={index}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillRow}
              contentContainerStyle={styles.pills}>
              {row.map(category => (
                <Squeeze key={category} onPress={() => openCourses(category)}>
                  <View
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                    ]}>
                    <Text style={[styles.pillText, { color: colors.text }]}>{category}</Text>
                  </View>
                </Squeeze>
              ))}
            </ScrollView>
          ))}

          <Button
            title="View All Courses"
            size="md"
            fullWidth={false}
            onPress={() => openCourses(null)}
            style={styles.viewAll}
          />
        </FadeUp>

        {['cti-academy-2', 'cti-academy-3'].map((seed, index) => (
          <FadeUp key={seed} delay={260 + index * 70} duration={600}>
            <Image source={{ uri: `https://picsum.photos/seed/${seed}/900/600` }} style={styles.block} />
            <Text style={[styles.heading, { color: colors.text }]}>
              <Text style={{ color: colors.primary }}>Integrate</Text> Academy is here for you!
            </Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>{PITCH}</Text>
          </FadeUp>
        ))}

        <FadeUp delay={420} duration={600}>
          <View style={[styles.banner, { backgroundColor: colors.primary }]}>
            <Text style={styles.bannerText}>
              To Access Academy Academy, You must be a Trendyol Seller. If you are not a seller, you
              can become one by clicking the button.
            </Text>
            <Squeeze onPress={() => openCourses(null)}>
              <View style={[styles.bannerButton, { backgroundColor: colors.background }]}>
                <Text style={[styles.bannerButtonText, { color: colors.primary }]}>
                  Go to Academy listing page
                </Text>
              </View>
            </Squeeze>
          </View>
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 6 },
  logo: { width: 110, height: 59 },

  body: { paddingHorizontal: 20, paddingTop: 6 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, padding: 0 },

  hero: { width: '100%', height: 200, borderRadius: 14, marginTop: 18 },
  block: { width: '100%', height: 200, borderRadius: 14, marginTop: 30 },

  heading: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, marginTop: 18 },
  subheading: { fontFamily: fonts.bold, fontSize: 16, marginTop: 12 },
  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, marginTop: 12 },

  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  cta: { flexGrow: 1 },

  centerHeading: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
    marginTop: 36,
  },
  centerText: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', marginTop: 8 },

  featuredScroll: { marginHorizontal: -20 },
  featuredRow: { gap: 12, paddingVertical: 20, paddingHorizontal: 20 },
  featured: { borderRadius: 22, paddingHorizontal: 20, paddingVertical: 13 },
  featuredText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' },

  // Negative margin lets the rows run to the screen edge while the page keeps
  // its 20px padding; the matching paddingHorizontal starts them back in line.
  pillRow: { marginHorizontal: -20, marginBottom: 10 },
  pills: { gap: 10, paddingHorizontal: 20 },
  pill: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 11 },
  pillText: { fontFamily: fonts.regular, fontSize: 14 },

  viewAll: { alignSelf: 'center', marginTop: 24 },

  banner: { borderRadius: 14, padding: 20, alignItems: 'center', gap: 16, marginTop: 34 },
  bannerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  bannerButton: { borderRadius: 22, paddingHorizontal: 22, paddingVertical: 12 },
  bannerButtonText: { fontFamily: fonts.bold, fontSize: 13 },
});
