import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, eyeBold, searchBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { CATEGORIES, COURSES } from '../data/courses';

export default function CoursesListScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Arriving from a category pill preselects it; "View All Courses" sends null.
  const [category, setCategory] = useState(route?.params?.category ?? null);
  const [search, setSearch] = useState('');

  const courses = COURSES.filter(course => {
    const matchesCategory = !category || course.category === category;
    const matchesSearch = course.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
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

        <Text style={[styles.title, { color: colors.text }]}>
          Academy <Text style={{ color: colors.primary }}>Courses</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Discover high-quality courses to grow your skills
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {[null, ...CATEGORIES].map(item => {
            const isActive = item === category;

            return (
              <Squeeze key={item ?? 'all'} onPress={() => setCategory(item)}>
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
                    {item ?? 'All'}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>

        <View style={styles.headingRow}>
          <View style={[styles.headingBar, { backgroundColor: colors.primary }]} />
          <Text style={[styles.heading, { color: colors.text }]}>{category ?? 'All Courses'}</Text>
        </View>

        {courses.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No courses found in this category.
          </Text>
        ) : (
          <View style={styles.grid}>
            {courses.map((course, index) => (
              <FadeUp key={course.id} delay={80 + index * 50} duration={550} style={styles.gridItem}>
                <View
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={[styles.cardText, { color: colors.textMuted }]} numberOfLines={2}>
                      {course.description}
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
                      onPress={() => navigation.navigate('CourseDetail', { course })}
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

  empty: { fontFamily: fonts.regular, fontSize: 14, marginTop: 30, textAlign: 'center' },

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
