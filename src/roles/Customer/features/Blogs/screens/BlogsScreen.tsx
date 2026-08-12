import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, calendarBold, heartExtra, shoppingCartExtra } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { BLOG_SECTIONS } from '../data/blogs';

function BlogCard({ post, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: post.image }} style={styles.cardImage} />

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>

        {post.description && (
          <Text style={[styles.cardText, { color: colors.textMuted }]} numberOfLines={2}>
            {post.description}
          </Text>
        )}

        <View style={styles.cardDate}>
          <Icon source={calendarBold} size={12} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{post.date}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function BlogsScreen({ navigation }) {
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

        <Text style={[styles.title, { color: colors.text }]}>Blogs</Text>

        {BLOG_SECTIONS.map(section => (
          <View key={section.label} style={styles.section}>
            <View style={[styles.chip, { backgroundColor: colors.primary + '1A' }]}>
              <View style={[styles.chipDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.chipText, { color: colors.text }]}>{section.label}</Text>
            </View>

            <View style={styles.grid}>
              {section.posts.map((post, index) => (
                <FadeUp key={post.id} delay={80 + index * 50} duration={550} style={styles.gridItem}>
                  <BlogCard
                    post={post}
                    onPress={() => navigation.navigate('BlogDetail', { post })}
                  />
                </FadeUp>
              ))}
            </View>
          </View>
        ))}
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
    paddingBottom: 10,
  },
  // 110 / 1.876 — the logo's own ratio (968x516). If the box is wider than that,
  // resizeMode="contain" centres the image inside it and it looks shifted right.
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

  body: { paddingHorizontal: 20, paddingTop: 10 },
  backWrap: { alignSelf: 'flex-start' },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 28, marginTop: 14 },

  section: { marginTop: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: fonts.bold, fontSize: 13 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  gridItem: { width: '48%', marginBottom: 14 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 110 },
  cardBody: { padding: 10, gap: 5 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18 },
  cardText: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15 },
  cardDate: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dateText: { fontFamily: fonts.regular, fontSize: 10 },
});
