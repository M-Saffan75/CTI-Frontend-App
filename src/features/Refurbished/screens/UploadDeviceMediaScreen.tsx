import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import {
  arrowLeftBold,
  cameraBold,
  chevronLeftBold,
  chevronRightBold,
  closeIcon,
  videoBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import CtiVerifiedSellCard from '../components/CtiVerifiedSellCard';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { upper } from '@/i18n/locale';

export default function UploadDeviceMediaScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Apple';
  const brandSlug = route?.params?.brandSlug || brand.toLowerCase();
  const brandId = route?.params?.brandId;
  const model = route?.params?.model || t('customer.n12ProMax');
  const modelSlug =
    route?.params?.modelSlug || model.toLowerCase().replace(/\s+/g, '-');
  const modelId = route?.params?.modelId;
  const categoryId = route?.params?.categoryId;
  const storage = route?.params?.storage || '128 GB';
  const selectedVariants = route?.params?.selectedVariants || [{ key: 'Storage', value: storage }];
  const conditionAnswers = route?.params?.conditionAnswers || {};

  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  // AlertModal State
  const [modal, setModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const handlePickPicture = () => {
    if (images.length >= 10) {
      setModal({
        visible: true,
        type: 'warning',
        title: i18n.t('customer.limitReached'),
        message: i18n.t('customer.youCanUploadAMaximum'),
      });
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 10 - images.length,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          setModal({
            visible: true,
            type: 'error',
            title: i18n.t('customer.mediaError'),
            message: response.errorMessage || i18n.t('customer.failedToSelectPictures'),
          });
          return;
        }

        const assets = response.assets || [];
        if (assets.length > 0) {
          setImages(prev => {
            const updated = [...prev, ...assets];
            return updated.slice(0, 10);
          });
        }
      },
    );
  };

  const handlePickVideo = () => {
    if (videos.length >= 3) {
      setModal({
        visible: true,
        type: 'warning',
        title: i18n.t('customer.limitReached'),
        message: i18n.t('customer.youCanUploadAMaximum2'),
      });
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'video',
        selectionLimit: 3 - videos.length,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          setModal({
            visible: true,
            type: 'error',
            title: i18n.t('customer.mediaError'),
            message: response.errorMessage || i18n.t('customer.failedToSelectVideos'),
          });
          return;
        }

        const assets = response.assets || [];
        if (assets.length > 0) {
          setVideos(prev => {
            const updated = [...prev, ...assets];
            return updated.slice(0, 3);
          });
        }
      },
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetQuote = () => {
    if (images.length === 0) {
      setModal({
        visible: true,
        type: 'warning',
        title: i18n.t('customer.picturesRequired'),
        message: i18n.t('customer.pleaseUploadAtLeast1'),
      });
      return;
    }

    navigation.navigate('QuoteApplication', {
      brand,
      brandSlug,
      brandId,
      model,
      modelSlug,
      modelId,
      categoryId,
      storage,
      selectedVariants,
      conditionAnswers,
      images,
      videos,
      picCount: images.length,
      vidCount: videos.length,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Back Button matching About Screen */}
        <Squeeze
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          scale={0.9}
          style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        {/* Upload Media Card matching Figma */}
        <View
          style={[
            styles.uploadCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <Text style={[styles.uploadTitle, { color: colors.text }]}>
            {t('customer.uploadDevicePhotosAndMedia')}
          </Text>
          <Text style={[styles.uploadSub, { color: colors.textMuted }]}>
            {t('customer.uploadImagesMax10And')}
          </Text>

          <View style={styles.dropzonesRow}>
            {/* Pictures Dropzone */}
            <TouchableOpacity
              onPress={handlePickPicture}
              style={[
                styles.dropzoneBox,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}>
              <View style={styles.dropzoneHeader}>
                <Text style={[styles.dropzoneType, { color: colors.text }]}>{t('customer.picture')}</Text>
                <Text style={[styles.dropzoneLimit, { color: colors.textMuted }]}>
                  {t('customerMsg.maxPics', { count: images.length })}
                </Text>
              </View>
              <View style={styles.dropzoneCenter}>
                <Icon source={cameraBold} size={28} color={colors.primary} />
                <Text style={[styles.dropzoneActionText, { color: colors.text }]}>
                  {t('customer.uploadPictures')}
                </Text>
                <Text style={[styles.dropzoneHint, { color: colors.textMuted }]}>
                  {t('customer.pngJpgUpTo10mb')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Video Dropzone */}
            <TouchableOpacity
              onPress={handlePickVideo}
              style={[
                styles.dropzoneBox,
                {
                  borderColor: colors.border + '66',
                  backgroundColor: colors.surfaceAlt,
                },
              ]}>
              <View style={styles.dropzoneHeader}>
                <Text style={[styles.dropzoneType, { color: colors.text }]}>{t('customer.video')}</Text>
                <Text style={[styles.dropzoneLimit, { color: colors.textMuted }]}>
                  {t('customerMsg.maxVids', { count: videos.length })}
                </Text>
              </View>
              <View style={styles.dropzoneCenter}>
                <Icon source={videoBold} size={28} color={colors.primary} />
                <Text style={[styles.dropzoneActionText, { color: colors.text }]}>
                  {t('customer.uploadVideo')}
                </Text>
                <Text style={[styles.dropzoneHint, { color: colors.textMuted }]}>
                  {t('customer.mp4MovUpTo50mb')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Attached Images Preview Grid */}
          {images.length > 0 && (
            <View style={styles.mediaPreviewSection}>
              <Text style={[styles.mediaSectionTitle, { color: colors.text }]}>
                {upper(t('customerMsg.attachedPhotos', { count: images.length }))}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailsScroll}>
                {images.map((img, idx) => (
                  <View key={idx} style={[styles.thumbWrapper, { borderColor: colors.border + '55' }]}>
                    <Image source={{ uri: img.uri }} style={styles.thumbImage} resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(idx)}
                      style={[styles.removeBadge, { backgroundColor: colors.error }]}>
                      <Icon source={closeIcon} size={10} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Attached Videos List */}
          {videos.length > 0 && (
            <View style={styles.mediaPreviewSection}>
              <Text style={[styles.mediaSectionTitle, { color: colors.text }]}>
                {upper(t('customerMsg.attachedVideos', { count: videos.length }))}
              </Text>
              {videos.map((vid, idx) => {
                const vidName = vid.fileName || i18n.t('customerMsg.videoName', { n: idx + 1 });
                const sizeMb = vid.fileSize ? (vid.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '';
                return (
                  <View
                    key={idx}
                    style={[
                      styles.videoRow,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                    ]}>
                    <Icon source={videoBold} size={18} color={colors.primary} />
                    <View style={styles.videoMeta}>
                      <Text style={[styles.videoName, { color: colors.text }]} numberOfLines={1}>
                        {vidName}
                      </Text>
                      {sizeMb ? <Text style={[styles.videoSize, { color: colors.textMuted }]}>{sizeMb}</Text> : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveVideo(idx)}
                      style={[styles.removeVideoBtn, { backgroundColor: colors.border + '33' }]}>
                      <Icon source={closeIcon} size={12} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.navBtnOutline,
                { borderColor: colors.border + '66', backgroundColor: colors.surfaceAlt },
              ]}>
              <Icon source={chevronLeftBold} size={14} color={colors.text} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.navBtnOutlineText, { color: colors.text }]}>{t('customer.previousStep')}</Text>
            </TouchableOpacity>

            <Squeeze
              onPress={handleGetQuote}
              disabled={images.length === 0}
              style={[
                styles.navBtnFilled,
                {
                  backgroundColor: images.length > 0 ? colors.primary : colors.textMuted + '55',
                },
              ]}>
              <View style={styles.btnRow}>
                <Text style={styles.navBtnFilledText}>{t('customer.getQuote')}</Text>
                <Icon source={chevronRightBold} size={14} color={colors.onPrimary} style={{ marginLeft: 6 }} />
              </View>
            </Squeeze>
          </View>
        </View>

        {/* Device Details Card matching Figma */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <Text style={[styles.detailsHeading, { color: colors.text }]}>{t('customer.deviceDetails')}</Text>
          <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

          <View style={styles.detailRow}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('customer.brand2')}</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{brand}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('customer.model')}</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {model}
                {selectedVariants && selectedVariants.length > 0
                  ? ` (${selectedVariants.map((v: any) => v.value).join(', ')})`
                  : storage
                  ? ` (${storage})`
                  : ''}
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, { marginTop: 12 }]}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('customer.mediaUploaded')}</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {t('customerMsg.picsVids', { pics: images.length, vids: videos.length })}
              </Text>
            </View>
          </View>
        </View>

        <CtiVerifiedSellCard />
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  backWrap: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  uploadSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 18,
  },
  dropzonesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dropzoneBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  dropzoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropzoneType: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  dropzoneLimit: {
    flexShrink: 1,
    fontSize: 10,
    fontFamily: fonts.medium,
  },
  dropzoneCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dropzoneActionText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    marginTop: 8,
  },
  dropzoneHint: {
    fontSize: 9,
    fontFamily: fonts.regular,
    marginTop: 2,
    textAlign: 'center',
  },
  mediaPreviewSection: {
    marginBottom: 16,
  },
  mediaSectionTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  thumbnailsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  videoMeta: {
    flex: 1,
  },
  videoName: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  videoSize: {
    fontSize: 10,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  removeVideoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  navBtnOutline: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navBtnOutlineText: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  navBtnFilled: {
    flex: 1.3,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnFilledText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  detailsHeading: {
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  trustCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  trustDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },
});
