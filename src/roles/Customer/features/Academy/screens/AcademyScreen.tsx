import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import { arrowLeftBold, searchBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { gradients } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import academyApi, { AcademicCategoryItem } from '@/services/academyApi';

const PITCH =
  'Hundreds of comprehensive training courses, enriched with hands-on content, await you at CTI Academy! Easily access all the knowledge you need, anytime and anywhere, and take your skills to the next level with personalized learning tailored to your journey.';

export default function AcademyScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<AcademicCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await academyApi.getCategories();
      setCategories(res);
    } catch (err) {
      if (__DEV__) console.warn('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const openCourses = (category?: string | null, categoryId?: string | null) => {
    navigation.navigate('Courses', {
      category: category ?? null,
      categoryId: categoryId ?? null,
      search: search.trim() || undefined,
    });
  };

  const handleSearchSubmit = () => {
    navigation.navigate('Courses', {
      category: null,
      search: search.trim(),
    });
  };

  // Split categories into 2 scrollable rows
  const half = Math.ceil(categories.length / 2);
  const pillRows = [categories.slice(0, half), categories.slice(half)];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
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

        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Icon source={searchBold} size={20} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            placeholder="Search Courses"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <FadeUp delay={100} duration={600}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80' }}
            style={[styles.hero, { backgroundColor: colors.primary }]}
          />

          <Text style={[styles.heading, { color: colors.text }]}>
            <Text style={{ color: colors.primary }}>CTI</Text> Academy is here for you!
          </Text>
          <Text style={[styles.subheading, { color: colors.text }]}>
            Hundreds of training courses!
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>{PITCH}</Text>

          <View style={styles.ctaRow}>
            <Button
              title="Explore Courses"
              size="md"
              fullWidth={false}
              onPress={() => openCourses(null)}
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

          {loading ? (
            <CtiLoader size="sm" text="Loading categories..." style={{ paddingVertical: 20 }} />
          ) : categories.length > 0 ? (
            <>
              {/* Category pills split across two rows */}
              {pillRows.map((row, index) =>
                row.length > 0 ? (
                  <ScrollView
                    key={index}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.pillRow}
                    contentContainerStyle={styles.pills}>
                    {row.map(cat => (
                      <Squeeze
                        key={cat.id}
                        onPress={() => openCourses(cat.title, cat.id)}>
                        <View
                          style={[
                            styles.pill,
                            { borderColor: colors.border, backgroundColor: colors.surface },
                          ]}>
                          <Text style={[styles.pillText, { color: colors.text }]}>
                            {cat.title}
                          </Text>
                        </View>
                      </Squeeze>
                    ))}
                  </ScrollView>
                ) : null,
              )}
            </>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No categories available at the moment.
            </Text>
          )}

          <Button
            title="View All Courses"
            size="md"
            fullWidth={false}
            onPress={() => openCourses(null)}
            style={styles.viewAll}
          />
        </FadeUp>

        <FadeUp delay={260} duration={600}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&auto=format&fit=crop&q=80' }}
            style={styles.block}
          />
          <Text style={[styles.heading, { color: colors.text }]}>
            <Text style={{ color: colors.primary }}>Learn &amp; Grow</Text> with Certified Experts
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>{PITCH}</Text>
        </FadeUp>

        <FadeUp delay={360} duration={600}>
          <View style={[styles.banner, { backgroundColor: colors.primary }]}>
            <Text style={styles.bannerText}>
              CTI Academy courses provide industry-grade learning modules for repair, electronics, and technical certifications.
            </Text>
            <Squeeze onPress={() => openCourses(null)}>
              <View style={[styles.bannerButton, { backgroundColor: colors.background }]}>
                <Text style={[styles.bannerButtonText, { color: colors.primary }]}>
                  Go to Academy Courses
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
  emptyText: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', marginVertical: 20 },

  pillRow: { marginHorizontal: -20, marginTop: 14, marginBottom: 4 },
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
