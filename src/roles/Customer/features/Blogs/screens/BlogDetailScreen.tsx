import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, calendarBold, clockBold, heartExtra, shoppingCartExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function BlogDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const post = route.params.post;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

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
        <ImageBackground source={{ uri: post.image }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <View style={[styles.chipDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.chipText, { color: colors.text }]}>Trending Articles</Text>
          </View>
        </ImageBackground>

        <FadeUp delay={100} duration={600}>
          <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Icon source={calendarBold} size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{post.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon source={clockBold} size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{post.readTime}</Text>
            </View>
          </View>

          <Text style={[styles.text, { color: colors.textMuted }]}>{post.intro}</Text>
        </FadeUp>

        {post.sections.map((section, index) => (
          <FadeUp key={section.title} delay={180 + index * 70} duration={600}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {index + 1}.  {section.title}
            </Text>

            <Text style={[styles.text, { color: colors.textMuted }]}>{section.text}</Text>

            <View style={styles.bullets}>
              {section.bullets.map(bullet => (
                <View key={bullet} style={styles.bullet}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.text, { color: colors.textMuted }]}>{bullet}</Text>
                </View>
              ))}
            </View>
          </FadeUp>
        ))}

        <FadeUp delay={180 + post.sections.length * 70} duration={600}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Conclusion</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>{post.conclusion}</Text>
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

  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, marginTop: 12 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, marginTop: 24 },
  bullets: { gap: 10, marginTop: 14 },
  bullet: { flexDirection: 'row', gap: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 19 },
});
