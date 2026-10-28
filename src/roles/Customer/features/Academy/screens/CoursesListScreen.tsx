import { useCallback, useEffect, useRef, useState } from 'react';
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

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import { arrowLeftBold, eyeBold, searchBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import academyApi, {
  AcademicCategoryItem,
  AcademicCourseItem,
} from '@/services/academyApi';

export default function CoursesListScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const initialCatName = route?.params?.category ?? null;
  const initialCatId = route?.params?.categoryId ?? null;
  const initialSearch = route?.params?.search ?? '';

  const [categories, setCategories] = useState<AcademicCategoryItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(initialCatId);
  const [selectedCatName, setSelectedCatName] = useState<string | null>(initialCatName);
  const [search, setSearch] = useState(initialSearch);
  const [courses, setCourses] = useState<AcademicCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const searchTimer = useRef<any>(null);

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const catList = await academyApi.getCategories();
        setCategories(catList);

        // If category name was passed without id, match it
        if (initialCatName && !initialCatId) {
          const match = catList.find(
            c => c.title.toLowerCase() === initialCatName.toLowerCase(),
          );
          if (match) setSelectedCatId(match.id);
        }
      } catch (e) {
        if (__DEV__) console.warn('Failed to load categories:', e);
      }
    })();
  }, [initialCatName, initialCatId]);

  // Fetch courses
  const fetchCourses = useCallback(async (catId: string | null, query: string) => {
    setLoading(true);
    try {
      const data = await academyApi.getCourses({
        categoryId: catId || 'all',
        search: query.trim() || undefined,
        limit: 50,
      });
      setCourses(data);
    } catch (err) {
      if (__DEV__) console.warn('Failed to load courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(selectedCatId, search);
  }, [fetchCourses, selectedCatId]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchCourses(selectedCatId, text);
    }, 400);
  };

  const handleSelectCategory = (cat: AcademicCategoryItem | null) => {
    if (!cat) {
      setSelectedCatId(null);
      setSelectedCatName(null);
    } else {
      setSelectedCatId(cat.id);
      setSelectedCatName(cat.title);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [catList] = await Promise.all([
        academyApi.getCategories(),
        fetchCourses(selectedCatId, search),
      ]);
      setCategories(catList);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
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

        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Icon source={searchBold} size={20} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => fetchCourses(selectedCatId, search)}
            placeholder="Search Courses"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Academy <Text style={{ color: colors.primary }}>Courses</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Discover high-quality courses to grow your skills
        </Text>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          <Squeeze onPress={() => handleSelectCategory(null)}>
            <View
              style={[
                styles.filter,
                {
                  borderColor: selectedCatId === null ? colors.primary : colors.border,
                  backgroundColor: selectedCatId === null ? colors.primary : colors.surface,
                },
              ]}>
              <Text
                style={[
                  styles.filterText,
                  { color: selectedCatId === null ? colors.onPrimary : colors.text },
                ]}>
                All
              </Text>
            </View>
          </Squeeze>

          {categories.map(item => {
            const isActive = item.id === selectedCatId;
            return (
              <Squeeze key={item.id} onPress={() => handleSelectCategory(item)}>
                <View
                  style={[
                    styles.filter,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary : colors.surface,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? colors.onPrimary : colors.text },
                    ]}>
                    {item.title}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>

        <View style={styles.headingRow}>
          <View style={[styles.headingBar, { backgroundColor: colors.primary }]} />
          <Text style={[styles.heading, { color: colors.text }]}>
            {selectedCatName ?? 'All Courses'}
          </Text>
        </View>

        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading courses..."
            style={{ paddingVertical: 40 }}
          />
        ) : courses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No courses found in this category.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {courses.map((course, index) => (
              <FadeUp key={course.id} delay={60 + index * 40} duration={500} style={styles.gridItem}>
                <View
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={[styles.cardText, { color: colors.textMuted }]} numberOfLines={2}>
                      {course.description || course.about}
                    </Text>

                    <View style={styles.views}>
                      <Icon source={eyeBold} size={14} color={colors.textMuted} />
                      <Text style={[styles.viewsText, { color: colors.textMuted }]}>
                        {course.views}
                      </Text>
                    </View>

                    <Button
                      title="Start Learning"
                      size="sm"
                      onPress={() => navigation.navigate('CourseDetail', { course, slug: course.slug })}
                      style={styles.cardButton}
                    />
                  </View>
                </View>
              </FadeUp>
            ))}
          </View>
        )}
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

  title: { fontFamily: fonts.bold, fontSize: 28, marginTop: 22 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, marginTop: 6 },

  filters: { gap: 10, paddingVertical: 18, paddingRight: 20 },
  filter: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  filterText: { fontFamily: fonts.regular, fontSize: 13 },

  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingBar: { width: 3, height: 20, borderRadius: 2 },
  heading: { fontFamily: fonts.bold, fontSize: 20 },

  emptyWrap: { paddingVertical: 50, alignItems: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  gridItem: { width: '48%', marginBottom: 14 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  thumbnail: { width: '100%', height: 100 },
  cardBody: { padding: 10, gap: 6 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 14 },
  cardText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  views: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewsText: { fontFamily: fonts.regular, fontSize: 12 },
  cardButton: { marginTop: 4 },
});
