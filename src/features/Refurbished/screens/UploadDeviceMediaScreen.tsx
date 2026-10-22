import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import {
  cameraBold,
  chevronLeftBold,
  chevronRightBold,
  shieldBold,
  videoBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';

export default function UploadDeviceMediaScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Apple';
  const model = route?.params?.model || '12 pro max';
  const storage = route?.params?.storage || '128 GB';
  const conditionAnswers = route?.params?.conditionAnswers || {};

  const [picCount, setPicCount] = useState(3);
  const [vidCount, setVidCount] = useState(1);

  const handlePickPicture = () => {
    if (picCount < 10) {
      setPicCount(picCount + 1);
      Alert.alert('Photo Added', 'Photo attached successfully to device verification.');
    } else {
      Alert.alert('Limit Reached', 'Maximum 10 pictures allowed.');
    }
  };

  const handlePickVideo = () => {
    if (vidCount < 3) {
      setVidCount(vidCount + 1);
      Alert.alert('Video Added', '360° device inspection video attached.');
    } else {
      Alert.alert('Limit Reached', 'Maximum 3 videos allowed.');
    }
  };

  const handleGetQuote = () => {
    navigation.navigate('QuoteApplication', {
      brand,
      model,
      storage,
      conditionAnswers,
      picCount,
      vidCount,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showBack={false} showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Upload Media Card matching Figma */}
        <View
          style={[
            styles.uploadCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <Text style={[styles.uploadTitle, { color: colors.text }]}>
            Upload Device Photos & Media
          </Text>
          <Text style={[styles.uploadSub, { color: colors.textMuted }]}>
            Upload images and videos of your device to verify its physical condition.
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
                <Text style={[styles.dropzoneType, { color: colors.text }]}>Picture</Text>
                <Text style={[styles.dropzoneLimit, { color: colors.textMuted }]}>
                  {picCount}/10 Max
                </Text>
              </View>
              <View style={styles.dropzoneCenter}>
                <Icon source={cameraBold} size={28} color={colors.primary} />
                <Text style={[styles.dropzoneActionText, { color: colors.text }]}>
                  Upload Pictures
                </Text>
                <Text style={[styles.dropzoneHint, { color: colors.textMuted }]}>
                  PNG, JPG up to 10MB
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
                <Text style={[styles.dropzoneType, { color: colors.text }]}>Video</Text>
                <Text style={[styles.dropzoneLimit, { color: colors.textMuted }]}>
                  {vidCount}/3 Max
                </Text>
              </View>
              <View style={styles.dropzoneCenter}>
                <Icon source={videoBold} size={28} color={colors.primary} />
                <Text style={[styles.dropzoneActionText, { color: colors.text }]}>
                  Upload Video
                </Text>
                <Text style={[styles.dropzoneHint, { color: colors.textMuted }]}>
                  MP4, MOV up to 50MB
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.navBtnOutline,
                { borderColor: colors.border + '66', backgroundColor: colors.surfaceAlt },
              ]}>
              <Icon source={chevronLeftBold} size={14} color={colors.text} />
              <Text style={[styles.navBtnOutlineText, { color: colors.text }]}>Previous Step</Text>
            </TouchableOpacity>

            <Squeeze
              onPress={handleGetQuote}
              style={[styles.navBtnFilled, { backgroundColor: colors.primary }]}>
              <View style={styles.btnRow}>
                <Text style={styles.navBtnFilledText}>Get Quote</Text>
                <Icon source={chevronRightBold} size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
          <Text style={[styles.detailsHeading, { color: colors.text }]}>Device Details</Text>
          <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

          <View style={styles.detailRow}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Brand</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{brand}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Model</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {model} ({storage})
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, { marginTop: 12 }]}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Media Uploaded</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {picCount} Pics, {vidCount} Vids
              </Text>
            </View>
          </View>
        </View>

        {/* Security & Guarantee Trust Card matching Figma */}
        <View
          style={[
            styles.trustCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <View style={styles.trustHeader}>
            <Icon source={shieldBold} size={20} color={colors.primary} />
            <Text style={[styles.trustTitle, { color: colors.text }]}>Device Detail</Text>
          </View>
          <Text style={[styles.trustDesc, { color: colors.textMuted }]}>
            Get paid instantly at your doorstep. We guarantee 100% data security and professional
            device assessment through the CTI platform.
          </Text>
        </View>
      </ScrollView>
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
    marginBottom: 20,
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
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  dropzoneLimit: {
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
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
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
