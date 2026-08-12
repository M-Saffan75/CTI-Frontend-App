import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import Button from '@/components/Button';
import { FadeUp } from '@/animations';
import { arrowLeftBold, heartExtra, playBtnExtra, sendBold, shoppingCartExtra } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function CourseDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const course = route.params.course;

  // Shares a link to the course, not the video file. The URL is a placeholder
  // until the backend gives us real course links.
  const onShare = () => {
    Share.share({
      title: course.title,
      message: `${course.title}\n\nhttps://cti.com/academy/course/${course.id}`,
    }).catch(() => {
      // User dismissed the share sheet — nothing to do.
    });
  };

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

        {/* The real video player comes later — this is the thumbnail with its
            play button so the layout is already correct. */}
        <ImageBackground
          source={{ uri: course.thumbnail }}
          style={styles.video}
          imageStyle={styles.videoImage}>
          <View style={styles.playCircle}>
            <Icon source={playBtnExtra} size={26} color={colors.primary} />
          </View>
        </ImageBackground>

        <FadeUp delay={100} duration={600}>
          <Text style={[styles.title, { color: colors.text }]}>{course.title}</Text>
          <Text style={[styles.category, { color: colors.textMuted }]}>
            Category: {course.category}
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>{course.about}</Text>

          <View style={styles.actions}>
            <Button
              title="Explore More Curses"
              size="md"
              fullWidth={false}
              onPress={() => navigation.goBack()}
              style={styles.action}
            />
            <Button
              title="Share"
              variant="outline"
              size="md"
              fullWidth={false}
              icon={sendBold}
              iconPosition="left"
              onPress={onShare}
              style={styles.action}
            />
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

  video: { height: 210, marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  videoImage: { borderRadius: 12 },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: { fontFamily: fonts.bold, fontSize: 26, marginTop: 20 },
  category: { fontFamily: fonts.regular, fontSize: 14, marginTop: 8 },
  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, marginTop: 14 },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  action: { flexGrow: 1 },
});
