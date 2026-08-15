import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Checkbox from '@/components/Checkbox';
import Button from '@/components/Button';
import { FadeUp } from '@/animations';
import { calendarBold, returnOfInvestmentIcon, sendBold, shieldIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import RepairmanTabs from '../../../components/RepairmanTabs';
import Select from '../../../components/Select';
import { TIME_UNITS, WARRANTY_OPTIONS } from '../data/jobs';

export default function SendProposalScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [basePrice, setBasePrice] = useState('');
  const [additionalFee, setAdditionalFee] = useState('');
  const [addFeeEnabled, setAddFeeEnabled] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('2');
  const [timeUnit, setTimeUnit] = useState('Days');
  const [canStartBy, setCanStartBy] = useState('');
  const [warranty, setWarranty] = useState('30 Days');
  const [dropOff, setDropOff] = useState(false);
  const [pickup, setPickup] = useState(false);

  const canSubmit = basePrice && (dropOff || pickup);

  const onSubmit = () => {
    if (!canSubmit) return;
    navigation.navigate('Home', { tab: 'MyOffers' });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <RepairmanTabs activeTab="JobBoard" onChange={tab => navigation.navigate('Home', { tab })} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <FadeUp delay={60} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={returnOfInvestmentIcon} size={18} color={colors.success} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Pricing Details</Text>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>Base Service Price</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.currency, { color: colors.textMuted }]}>₺</Text>
              <TextInput
                value={basePrice}
                onChangeText={setBasePrice}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <View style={styles.checkboxRow}>
              <Checkbox checked={addFeeEnabled} onChange={setAddFeeEnabled} label="Add extra fee" />
            </View>
            {addFeeEnabled && (
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.currency, { color: colors.textMuted }]}>₺</Text>
                <TextInput
                  value={additionalFee}
                  onChangeText={setAdditionalFee}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            )}
          </View>
        </FadeUp>

        <FadeUp delay={110} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={shieldIcon} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Timeline &amp; Warranty</Text>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>Estimated Time</Text>
            <View style={styles.row}>
              <View style={[styles.inputRow, styles.rowField, { backgroundColor: colors.surfaceAlt }]}>
                <TextInput
                  value={estimatedTime}
                  onChangeText={setEstimatedTime}
                  keyboardType="numeric"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
              <Select value={timeUnit} options={TIME_UNITS} onChange={setTimeUnit} style={styles.rowField} />
            </View>

            <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>Can start by</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}>
              <TextInput
                value={canStartBy}
                onChangeText={setCanStartBy}
                placeholder="e.g. Tomorrow"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
              />
              <Icon source={calendarBold} size={16} color={colors.textMuted} />
            </View>

            <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>Warranty Duration</Text>
            <Select value={warranty} options={WARRANTY_OPTIONS} onChange={setWarranty} />
          </View>
        </FadeUp>

        <FadeUp delay={160} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Service Option</Text>
              {!dropOff && !pickup && (
                <Text style={[styles.required, { color: colors.error }]}>Select at least one</Text>
              )}
            </View>

            <View style={[styles.optionRow, { backgroundColor: colors.surfaceAlt }]}>
              <Checkbox checked={dropOff} onChange={setDropOff} />
              <View style={styles.optionText}>
                <View style={styles.optionHead}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Drop-off Service</Text>
                  <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                </View>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  Customer will bring the item to your location
                </Text>
              </View>
            </View>

            <View style={[styles.optionRow, { backgroundColor: colors.surfaceAlt }]}>
              <Checkbox checked={pickup} onChange={setPickup} />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Pickup Service Available</Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  Pick up the item from customer's location
                </Text>
              </View>
            </View>
          </View>
        </FadeUp>

        <Button
          title="Submit offer"
          icon={sendBold}
          iconPosition="left"
          disabled={!canSubmit}
          onPress={onSubmit}
          style={styles.submitButton}
        />
        <Text style={[styles.helper, { color: colors.textMuted }]}>
          Please fill in all required fields to submit your offer
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  required: { fontFamily: fonts.medium, fontSize: 11 },

  label: { fontFamily: fonts.regular, fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, height: 48, paddingHorizontal: 14 },
  currency: { fontFamily: fonts.bold, fontSize: 14 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, padding: 0 },
  checkboxRow: { marginTop: 12, marginBottom: 10 },

  row: { flexDirection: 'row', gap: 10 },
  rowField: { flex: 1 },

  optionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 10, padding: 12, marginTop: 10 },
  optionText: { flex: 1, gap: 4 },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionTitle: { fontFamily: fonts.bold, fontSize: 14 },
  optionDescription: { fontFamily: fonts.regular, fontSize: 12 },
  freeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  freeBadgeText: { fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' },

  submitButton: { marginTop: 20 },
  helper: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'center', marginTop: 10 },
});
