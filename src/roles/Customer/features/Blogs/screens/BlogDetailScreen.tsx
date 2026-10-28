import { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import { arrowLeftBold, calendarBold, clockBold, packageBold, shoppingCartExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import blogApi, { MobileBlog } from '@/services/blogApi';

export default function BlogDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const initialPost: MobileBlog | undefined = route?.params?.post;
  const slug: string | undefined = route?.params?.slug || initialPost?.slug;

  const [post, setPost] = useState<MobileBlog | null>(initialPost || null);
  const [loading, setLoading] = useState<boolean>(!initialPost && !!slug);

  useEffect(() => {
    if (slug && (!initialPost || !initialPost.content)) {
      setLoading(true);
      blogApi.getBlogBySlug(slug)
        .then(live => {
          if (live) setPost(live);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const paragraphs = (post?.content || post?.description || '')
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <Icon source={shoppingCartExtra} size={24} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CtiLoader size="md" text="Loading article..." />
        </View>
      ) : !post ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Icon source={packageBold} size={48} color={colors.textMuted} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 14 }}>
            Article Not Found
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
            This blog post is not available or has been removed.
          </Text>
          <Squeeze onPress={() => navigation.goBack()} style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontFamily: fonts.bold }}>Go Back</Text>
          </Squeeze>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}>
          <ImageBackground
            source={{ uri: post.image || 'https://picsum.photos/seed/blog/800/500' }}
            style={styles.hero}
            imageStyle={styles.heroImage}>
            <View style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={[styles.chipDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.chipText, { color: colors.text }]}>
                {post.tags?.[0] ? post.tags[0].toUpperCase() : 'CTI INSIGHTS'}
              </Text>
            </View>
          </ImageBackground>

          <FadeUp delay={100} duration={600}>
            <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Icon source={calendarBold} size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{post.date}</Text>
              </View>
              {post.readTime ? (
                <View style={styles.metaItem}>
                  <Icon source={clockBold} size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{post.readTime}</Text>
                </View>
              ) : null}
            </View>

            {paragraphs.map((p, idx) => (
              <Text key={idx} style={[styles.text, { color: colors.text }]}>
                {p}
              </Text>
            ))}
          </FadeUp>
        </ScrollView>
      )}
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
  backWrap: { alignSelf: 'flex-start' },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  body: { paddingHorizontal: 20, paddingTop: 6 },
  hero: { height: 230, justifyContent: 'flex-start', padding: 14 },
  heroImage: { borderRadius: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: fonts.bold, fontSize: 13 },

  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, marginTop: 20 },
  meta: { flexDirection: 'row', gap: 18, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: fonts.regular, fontSize: 13 },

  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, marginTop: 14 },
});
