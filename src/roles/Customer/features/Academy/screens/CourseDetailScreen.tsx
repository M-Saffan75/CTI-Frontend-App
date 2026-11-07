import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import Button from '@/components/Button';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  closeIcon,
  eyeBold,
  heartExtra,
  playBtnExtra,
  pauseBtnExtra,
  sendBold,
  shoppingCartExtra,
  starExtra,
  videoSlashBold,
  volumeUpBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import academyApi, { AcademicCourseItem } from '@/services/academyApi';

const SPEEDS = [1, 1.25, 1.5, 2, 0.5];

function formatTime(t: number): string {
  if (!t || isNaN(t) || t < 0) return '00:00';
  const flo = Math.floor(t);
  const mm = String(Math.floor(flo / 60)).padStart(2, '0');
  const ss = String(flo % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * In-Screen Video Player with Exact Next.js Controls & Behavior:
 * - Real-time stream from course.video
 * - Big center play overlay button
 * - Scrubbable seek bar
 * - Play / Pause toggle
 * - Volume / Mute toggle
 * - Time format: 00:00 / 00:00
 * - Playback rate switcher (0.5x, 1x, 1.25x, 1.5x, 2x)
 * - Fullscreen player modal
 * - Auto-hiding controls on playback
 */
function InAppVideoPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title?: string;
}) {
  const { colors } = useTheme();
  const videoRef = useRef<any>(null);

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [posterError, setPosterError] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [barWidth, setBarWidth] = useState<number>(0);
  const [fsBarWidth, setFsBarWidth] = useState<number>(0);

  const hideTimer = useRef<any>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [playing]);

  const toggleControls = () => {
    setShowControls(prev => {
      const next = !prev;
      if (next && playing) {
        resetHideTimer();
      }
      return next;
    });
  };

  const handleStartPlay = () => {
    setHasStarted(true);
    setPlaying(true);
    setShowControls(true);
    resetHideTimer();
  };

  const togglePlay = () => {
    if (!hasStarted) {
      handleStartPlay();
      return;
    }
    setPlaying(prev => {
      const next = !prev;
      if (next) {
        setShowControls(true);
        resetHideTimer();
      } else {
        setShowControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      }
      return next;
    });
  };

  const handleSeek = (e: any, width: number) => {
    if (!duration || !width) return;
    const clickX = e.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, clickX / width));
    const targetTime = pct * duration;
    videoRef.current?.seek(targetTime);
    setCurrentTime(targetTime);
    resetHideTimer();
  };

  const cycleSpeed = () => {
    const nextIdx = (SPEEDS.indexOf(playbackRate) + 1) % SPEEDS.length;
    setPlaybackRate(SPEEDS[nextIdx]);
    resetHideTimer();
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const renderPlayer = (fullscreenMode = false) => {
    const currentBarWidth = fullscreenMode ? fsBarWidth : barWidth;
    const setWidthFn = fullscreenMode ? setFsBarWidth : setBarWidth;

    return (
      <View
        style={[
          fullscreenMode ? styles.fsContainer : styles.playerBox,
          { backgroundColor: '#000000' },
        ]}>
        {/* Main Video View */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={StyleSheet.absoluteFill}>
          <Video
            ref={videoRef}
            source={{ uri: src }}
            paused={!playing}
            muted={muted}
            rate={playbackRate}
            resizeMode="contain"
            onLoad={(meta: any) => {
              setDuration(meta.duration || 0);
            }}
            onProgress={(data: any) => {
              setCurrentTime(data.currentTime || 0);
            }}
            onBuffer={({ isBuffering: b }: any) => {
              setIsBuffering(b);
            }}
            onEnd={() => {
              setPlaying(false);
              setCurrentTime(0);
              videoRef.current?.seek(0);
              setShowControls(true);
            }}
            style={StyleSheet.absoluteFill}
          />
        </TouchableOpacity>

        {/* Poster / Thumbnail Overlay before initial playback */}
        {!hasStarted && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111827' }]}>
            {poster && !posterError ? (
              <Image
                source={{ uri: poster }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onError={() => setPosterError(true)}
              />
            ) : (
              <View style={[styles.playerFallback, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={ctiLogo} style={styles.playerFallbackLogo} resizeMode="contain" />
                {!!title && (
                  <Text style={[styles.playerFallbackTitle, { color: colors.text }]} numberOfLines={2}>
                    {title}
                  </Text>
                )}
              </View>
            )}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleStartPlay}
              style={styles.centerOverlay}>
              <View style={[styles.bigPlayBtn, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                <Icon source={playBtnExtra} size={30} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Buffering Indicator */}
        {isBuffering && (
          <View style={styles.centerOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Big Center Play Overlay (Visible when paused after start) */}
        {hasStarted && !playing && !isBuffering && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={togglePlay}
            style={styles.centerOverlay}>
            <View style={[styles.bigPlayBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
              <Icon source={playBtnExtra} size={30} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Top Fullscreen Header */}
        {fullscreenMode && showControls && (
          <View style={styles.fsHeader}>
            <Text style={styles.fsTitle} numberOfLines={1}>
              {title || 'Course Lecture'}
            </Text>
            <TouchableOpacity
              onPress={() => setIsFullscreen(false)}
              style={styles.fsCloseButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon source={closeIcon} size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Control Bar */}
        {showControls && (
          <View style={styles.bottomControlsBar}>
            {/* Seekbar / Progress Bar (Clickable/Scrubbable) */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={e => handleSeek(e, currentBarWidth)}
              onLayout={e => setWidthFn(e.nativeEvent.layout.width)}
              style={styles.seekTouchArea}>
              <View style={styles.seekTrack}>
                <View
                  style={[
                    styles.seekFill,
                    { width: `${progressPercent}%`, backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.seekThumb,
                    { left: `${Math.max(0, Math.min(97, progressPercent))}%`, backgroundColor: '#FFFFFF' },
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* Controls Button Row */}
            <View style={styles.buttonsRow}>
              {/* Play / Pause Toggle */}
              <TouchableOpacity onPress={togglePlay} style={styles.iconBtn}>
                <Icon
                  source={playing ? pauseBtnExtra : playBtnExtra}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {/* Volume / Mute Toggle */}
              <TouchableOpacity onPress={() => setMuted(m => !m)} style={styles.iconBtn}>
                <Icon
                  source={muted ? videoSlashBold : volumeUpBold}
                  size={18}
                  color={muted ? colors.primary : '#FFFFFF'}
                />
              </TouchableOpacity>

              {/* Time Display: formatTime(currentTime) / formatTime(duration) */}
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>

              <View style={{ flex: 1 }} />

              {/* Playback Speed Selector (0.5x, 1x, 1.25x, 1.5x, 2x) */}
              <TouchableOpacity onPress={cycleSpeed} style={styles.speedPill}>
                <Text style={styles.speedText}>{playbackRate}x</Text>
              </TouchableOpacity>

              {/* Fullscreen Toggle */}
              <TouchableOpacity
                onPress={() => setIsFullscreen(fs => !fs)}
                style={styles.iconBtn}>
                <Text style={styles.fullscreenIcon}>⛶</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.playerWrapper}>
      {renderPlayer(false)}

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullscreen(false)}>
        <StatusBar hidden={true} />
        {renderPlayer(true)}
      </Modal>
    </View>
  );
}

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
          // Increment views on backend (identical to Next.js web app)
          academyApi.patchCourseViews(slug).catch(() => {});
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
      message: `${course.title}\n\nhttps://cti.com.pk/academy/academy-listing/${course.slug || course.id}`,
    }).catch(() => {});
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

  const cleanDescription = (course.about || course.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const ratingDisplay = course.averageRating > 0 ? course.averageRating.toFixed(1) : '4.5';

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

        {/* Video Player Section with Real-time Backend Stream & Next.js Functions */}
        {course.video ? (
          <InAppVideoPlayer
            src={course.video}
            poster={course.thumbnail}
            title={course.title}
          />
        ) : (
          <View style={[styles.noVideoCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Icon source={videoSlashBold} size={40} color={colors.textMuted} />
            <Text style={[styles.noVideoTitle, { color: colors.text }]}>No Video Available</Text>
            <Text style={[styles.noVideoSubtitle, { color: colors.textMuted }]}>
              There is no video lecture uploaded for this course yet.
            </Text>
          </View>
        )}

        <FadeUp delay={100} duration={600}>
          <Text style={[styles.title, { color: colors.text }]}>{course.title}</Text>

          {/* Meta details */}
          <View style={styles.metaRow}>
            {!!course.category && (
              <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>
                  {course.category}
                </Text>
              </View>
            )}

            {!!course.subCategory && (
              <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.categoryText, { color: colors.textMuted }]}>
                  {course.subCategory}
                </Text>
              </View>
            )}

            <View style={styles.ratingBadge}>
              <Icon source={starExtra} size={15} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {ratingDisplay}
              </Text>
            </View>

            <View style={styles.views}>
              <Icon source={eyeBold} size={15} color={colors.textMuted} />
              <Text style={[styles.viewsText, { color: colors.textMuted }]}>
                {course.views} views
              </Text>
            </View>
          </View>

          {/* Description */}
          {!!cleanDescription && (
            <Text style={[styles.text, { color: colors.textMuted }]}>
              {cleanDescription}
            </Text>
          )}

          {/* Actions */}
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

  playerWrapper: { marginTop: 18 },
  playerBox: {
    width: '100%',
    height: 230,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  fsContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  playerFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  playerFallbackLogo: {
    width: 90,
    height: 45,
    opacity: 0.85,
  },
  playerFallbackTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: 'center',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bigPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },

  fsHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  fsTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  fsCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 20,
  },
  seekTouchArea: {
    width: '100%',
    paddingVertical: 8,
  },
  seekTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  seekFill: {
    height: '100%',
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  iconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  speedPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  fullscreenIcon: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },

  noVideoCard: {
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noVideoTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    marginTop: 4,
  },
  noVideoSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, marginTop: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  categoryBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: { fontFamily: fonts.bold, fontSize: 11 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: fonts.bold, fontSize: 13 },
  views: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { fontFamily: fonts.regular, fontSize: 13 },
  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, marginTop: 14 },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  action: { flexGrow: 1 },
});
