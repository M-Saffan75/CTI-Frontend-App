import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { closeIcon, starExtra, toolExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { NormalizedOffer } from '../services/customerJobApi';

const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

export interface BookingModalProps {
  visible: boolean;
  offer: NormalizedOffer | null;
  jobTitle?: string;
  onClose: () => void;
  onSubmit: (bookingData: {
    serviceType: string;
    scheduledDate: string;
    specialInstructions: string;
    pickUpAddress?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function BookingModal({
  visible,
  offer,
  jobTitle,
  onClose,
  onSubmit,
  isSubmitting = false,
}: BookingModalProps) {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [serviceType, setServiceType] = useState<'drop-off' | 'pickup' | 'home-service'>('drop-off');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [pickUpAddress, setPickUpAddress] = useState('');
  const [error, setError] = useState('');

  const progress = useSharedValue(0);

  // Compute a guaranteed future scheduled date (Tomorrow 10:00 AM)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(10, 0, 0, 0);
  const scheduledDateIso = tomorrow.toISOString();
  const scheduledDateLabel = tomorrow.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setError('');
      setServiceType('drop-off');
      setSpecialInstructions('');
      setPickUpAddress('');
      progress.value = withTiming(1, { duration: OPEN_MS, easing: EASING });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASING }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  if (!offer) return null;

  // Calculate total with service option
  const basePrice = offer.totalPrice || offer.basePrice || 0;
  const pickupFee = serviceType === 'pickup' && offer.pickupAvailable ? offer.pickupCharge || 0 : 0;
  const totalAmount = basePrice + pickupFee;

  const handleConfirm = async () => {
    if (serviceType === 'pickup' && !pickUpAddress.trim()) {
      setError('Please provide a pickup address.');
      return;
    }

    setError('');
    await onSubmit({
      serviceType,
      scheduledDate: scheduledDateIso,
      specialInstructions: specialInstructions.trim(),
      pickUpAddress: pickUpAddress.trim(),
    });
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.center}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdrop]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={isSubmitting ? undefined : onClose} />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: colors.background }, card]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Book Repair Service</Text>
              {Boolean(jobTitle) && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {jobTitle}
                </Text>
              )}
            </View>
            <Squeeze onPress={onClose} disabled={isSubmitting} scale={0.85}>
              <Icon source={closeIcon} size={20} color={colors.text} />
            </Squeeze>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Technician Info Card */}
            <View style={[styles.techBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <View style={styles.techIconWrap}>
                <Icon source={toolExtra} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.techName, { color: colors.text }]}>
                  {offer.repairmanName}
                </Text>
                <Text style={[styles.techShop, { color: colors.textMuted }]}>
                  @{offer.shopName}
                </Text>
              </View>
              <View style={styles.techRating}>
                <Icon source={starExtra} size={14} color="#f59e0b" />
                <Text style={[styles.techRatingText, { color: colors.text }]}>
                  {offer.rating.toFixed(1)}
                </Text>
              </View>
            </View>

            {/* Error Banner */}
            {Boolean(error) && (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {/* Service Type Selection */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Select Service Preference
            </Text>
            <View style={styles.serviceTypesWrap}>
              {/* Option 1: Drop-off */}
              <Pressable
                onPress={() => setServiceType('drop-off')}
                style={[
                  styles.serviceOption,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  serviceType === 'drop-off' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                ]}
              >
                <View style={[styles.radioCircle, { borderColor: colors.primary }]}>
                  {serviceType === 'drop-off' && (
                    <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Drop-off at Shop
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                    Bring your device directly to the repair workshop
                  </Text>
                </View>
              </Pressable>

              {/* Option 2: Pickup (if available) */}
              {offer.pickupAvailable && (
                <Pressable
                  onPress={() => setServiceType('pickup')}
                  style={[
                    styles.serviceOption,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    serviceType === 'pickup' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                  ]}
                >
                  <View style={[styles.radioCircle, { borderColor: colors.primary }]}>
                    {serviceType === 'pickup' && (
                      <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Pickup Service (+{offer.currency} {offer.pickupCharge})
                    </Text>
                    <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                      Technician collects the device from your address
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* Option 3: Home Service (if available) */}
              {offer.homeService && (
                <Pressable
                  onPress={() => setServiceType('home-service')}
                  style={[
                    styles.serviceOption,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    serviceType === 'home-service' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                  ]}
                >
                  <View style={[styles.radioCircle, { borderColor: colors.primary }]}>
                    {serviceType === 'home-service' && (
                      <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Home Service
                    </Text>
                    <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                      Technician repairs the device at your location
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Pickup Address (if pickup selected) */}
            {serviceType === 'pickup' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Pickup Address *
                </Text>
                <TextInput
                  value={pickUpAddress}
                  onChangeText={setPickUpAddress}
                  placeholder="Enter full address for device pickup..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.textInput,
                    { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}
                />
              </View>
            )}

            {/* Scheduled Date Display */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Scheduled Service Date
              </Text>
              <View style={[styles.dateBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {scheduledDateLabel} (10:00 AM)
                </Text>
                <Text style={[styles.dateSub, { color: colors.primary }]}>
                  Earliest available slot
                </Text>
              </View>
            </View>

            {/* Special Instructions */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Special Instructions (Optional)
              </Text>
              <TextInput
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                placeholder="Any special instructions or details about device access..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
                style={[
                  styles.textArea,
                  { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              />
            </View>

            {/* Pricing Summary Box */}
            <View style={[styles.summaryBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Base Offer:</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>
                  {offer.currency} {basePrice.toLocaleString()}
                </Text>
              </View>

              {pickupFee > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Pickup Fee:</Text>
                  <Text style={[styles.summaryVal, { color: colors.text }]}>
                    +{offer.currency} {pickupFee.toLocaleString()}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 6 }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount:</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>
                  {offer.currency} {totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerBtns}>
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>

            <Squeeze
              onPress={handleConfirm}
              disabled={isSubmitting}
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Booking</Text>
              )}
            </Squeeze>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  scrollContent: {
    paddingBottom: 10,
    gap: 12,
  },
  techBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  techIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techName: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  techShop: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  techRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  techRatingText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 6,
  },
  serviceTypesWrap: {
    gap: 8,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  optionSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 1,
  },
  inputGroup: {
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    height: 70,
    textAlignVertical: 'top',
  },
  dateBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  dateSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  summaryVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  totalVal: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  footerBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1.4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});

