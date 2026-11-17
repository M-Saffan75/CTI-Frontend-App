import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { checkCircleBold, exclamationCircleBold, infoCircleBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

export type AlertModalType = 'error' | 'success' | 'warning' | 'info';

export interface AlertModalProps {
  visible: boolean;
  type?: AlertModalType;
  title?: string;
  message?: string;
  buttonText?: string;
  secondaryButtonText?: string;
  onButtonPress?: () => void;
  onSecondaryButtonPress?: () => void;
  onClose?: () => void;
}

export default function AlertModal(props: AlertModalProps) {
  // While the modal fades out the screen has already cleared its text and type; keep the last shown ones
  const shown = useRef(props);
  if (props.visible) shown.current = props;
  const {
    visible,
    type = 'error',
    title,
    message,
    buttonText,
    secondaryButtonText,
    onButtonPress,
    onSecondaryButtonPress,
    onClose,
  } = props.visible ? props : { ...shown.current, visible: false, onClose: props.onClose };
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  // The open/close effect only reacts to `visible`; it reads the latest mounted flag from a ref
  const mountedRef = useRef(false);
  mountedRef.current = mounted;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: OPEN_MS, easing: EASING });
    } else if (mountedRef.current) {
      progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASING }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, progress]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));

  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  const handlePrimaryPress = () => {
    if (onButtonPress) onButtonPress();
    else if (onClose) onClose();
  };

  const handleSecondaryPress = () => {
    if (onSecondaryButtonPress) onSecondaryButtonPress();
    else if (onClose) onClose();
  };

  const isError = type === 'error';
  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  const iconSource = isSuccess
    ? checkCircleBold
    : isWarning || isError
    ? exclamationCircleBold
    : infoCircleBold;

  const accentColor = isSuccess
    ? '#10B981'
    : isError
    ? colors.error || '#EF4444'
    : isWarning
    ? '#F59E0B'
    : colors.primary;

  const defaultTitle = isSuccess
    ? t('common.success')
    : isError
    ? t('common.error')
    : isWarning
    ? t('common.warning')
    : t('common.notice');

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.center}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop || '#00000088' }, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: colors.surface }, card]}>
          {/* Top Status Icon */}
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
            <Icon source={iconSource} size={30} color={accentColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{title || defaultTitle}</Text>

          {/* Message */}
          {message ? (
            <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {secondaryButtonText ? (
              <Button
                title={secondaryButtonText}
                variant="soft"
                size="md"
                onPress={handleSecondaryPress}
                style={styles.actionBtn}
              />
            ) : null}

            <Button
              title={buttonText ?? t('common.okay')}
              size="md"
              color={isError ? accentColor : null}
              onPress={handlePrimaryPress}
              style={styles.actionBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
});
