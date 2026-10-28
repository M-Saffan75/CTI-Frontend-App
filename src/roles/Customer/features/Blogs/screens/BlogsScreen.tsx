import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import { arrowLeftBold, calendarBold, heartExtra, packageBold, shoppingCartExtra } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import blogApi, { MobileBlog } from '@/services/blogApi';

function BlogCard({ post, onPress }: { post: MobileBlog; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image
        source={{ uri: post.image || 'https://picsum.photos/seed/blog/800/500' }}
        style={styles.cardImage}
      />

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>

        {post.description ? (
          <Text style={[styles.cardText, { color: colors.textMuted }]} numberOfLines={2}>
            {post.description}
          </Text>
        ) : null}

        <View style={styles.cardDate}>
          <Icon source={calendarBold} size={12} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{post.date}</Text>
          {post.readTime ? (
            <Text style={[styles.dateText, { color: colors.primary, marginLeft: 8 }]}>
              • {post.readTime}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function BlogsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [blogs, setBlogs] = useState<MobileBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await blogApi.getBlogs();
      setBlogs(data || []);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <Icon source={shoppingCartExtra} size={24} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBlogs(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>Blogs & Insights</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Discover the latest stories, tips and updates from CTI
        </Text>

        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading latest blogs..."
            style={{ paddingVertical: 50 }}
          />
        ) : blogs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon source={packageBold} size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Blogs Found</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              There are no published blog posts right now. Check back later!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {blogs.map((post, index) => (
              <FadeUp key={post.id || post.slug} delay={60 + index * 40} duration={450} style={styles.gridItem}>
                <BlogCard
                  post={post}
                  onPress={() => navigation.navigate('BlogDetail', { post, slug: post.slug })}
                />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  body: { paddingHorizontal: 20, paddingTop: 6 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 14 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4, marginBottom: 16 },

  grid: { gap: 16 },
  gridItem: { width: '100%' },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 165 },
  cardBody: { padding: 16, gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  cardText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  cardDate: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dateText: { fontFamily: fonts.regular, fontSize: 12 },

  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
});
