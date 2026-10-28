import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import Button from '@/components/Button';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  eyeBold,
  heartExtra,
  playBtnExtra,
  sendBold,
  shoppingCartExtra,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import academyApi, { AcademicCourseItem } from '@/services/academyApi';

export default function CourseDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds } = useWishlist();

  const initialCourse: AcademicCourseItem | undefined = route?.params?.course;
  const slug = route?.params?.slug || initialCourse?.slug;

  const [course, setCourse] = useState<AcademicCourseItem | null>(initialCourse || null);
  const [loading, setLoading] = useState<boolean>(!initialCourse && !!slug);

  useEffect(() => {
    if (slug) {
      let isMounted = true;
      (async () => {
        try {
          const fresh = await academyApi.getCourseBySlug(slug);
          if (isMounted && fresh) {
            setCourse(fresh);
          }
        } catch (e) {
          if (__DEV__) console.warn('Failed to load course details:', e);
        } finally {
          if (isMounted) setLoading(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }
  }, [slug]);

  const onShare = () => {
    if (!course) return;
    Share.share({
      title: course.title,
      message: `${course.title}\n\nhttps://cti.com/academy/course/${course.slug || course.id}`,
    }).catch(() => {});
  };

  const handlePlayVideo = async () => {
    if (!course?.video) {
      Alert.alert('Video Preview', 'Video lecture preview is coming soon.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(course.video);
      if (supported) {
        await Linking.openURL(course.video);
      } else {
        Alert.alert('Video Preview', 'Unable to open video URL.');
      }
    } catch {
      Alert.alert('Video Preview', 'Could not open video player.');
    }
  };

  if (loading && !course) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        </View>
        <View style={styles.centered}>
          <CtiLoader size="lg" text="Loading course details..." />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
            Course Not Found
          </Text>
          <Text style={[styles.text, { color: colors.textMuted, textAlign: 'center', marginBottom: 20 }]}>
            The requested course could not be loaded.
          </Text>
          <Button
            title="Back to Courses"
            size="md"
            fullWidth={false}
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Wishlist')} scale={0.85}>
            <View>
              <Icon source={heartExtra} size={24} color={colors.text} />
              {wishlistIds.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{wishlistIds.length}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <Icon source={shoppingCartExtra} size={24} color={colors.text} />
          </Squeeze>
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

        {/* Video Thumbnail with Play Button */}
        <TouchableOpacity activeOpacity={0.85} onPress={handlePlayVideo}>
          <ImageBackground
            source={{ uri: course.thumbnail }}
            style={styles.video}
            imageStyle={styles.videoImage}>
            <View style={styles.playCircle}>
              <Icon source={playBtnExtra} size={26} color={colors.primary} />
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <FadeUp delay={100} duration={600}>
          <Text style={[styles.title, { color: colors.text }]}>{course.title}</Text>
          
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: colors.primary }]}>
              {course.category}
            </Text>
            {course.views > 0 && (
              <View style={styles.views}>
                <Icon source={eyeBold} size={14} color={colors.textMuted} />
                <Text style={[styles.viewsText, { color: colors.textMuted }]}>
                  {course.views} views
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.text, { color: colors.textMuted }]}>
            {course.about || course.description || 'Comprehensive training course from CTI Academy.'}
          </Text>

          <View style={styles.actions}>
            <Button
              title="Explore More Courses"
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

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  category: { fontFamily: fonts.medium, fontSize: 14 },
  views: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewsText: { fontFamily: fonts.regular, fontSize: 13 },
  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, marginTop: 14 },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  action: { flexGrow: 1 },
});
