import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { FadeUp } from '@/animations';
import { storeBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import RepairmanTabs from '../../../components/RepairmanTabs';

export default function BankingInformationScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [iban, setIban] = useState('');

  const canSave = accountTitle && accountNumber && bankName && branchName && iban;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <RepairmanTabs activeTab="Earnings" onChange={tab => navigation.navigate('Home', { tab })} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <FadeUp delay={60} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={storeBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Banking Information</Text>
            </View>

            <Input label="Account Title" value={accountTitle} onChangeText={setAccountTitle} style={styles.field} />
            <Input label="Account Number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" style={styles.field} />
            <Input label="Bank Name" value={bankName} onChangeText={setBankName} style={styles.field} />
            <Input label="Branch Name" value={branchName} onChangeText={setBranchName} style={styles.field} />
            <Input label="IBAN" value={iban} onChangeText={setIban} autoCapitalize="characters" style={styles.field} />

            <Button title="Save Profile" disabled={!canSave} onPress={() => navigation.goBack()} style={styles.spaced} />
            <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.spaced} />
          </View>
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17 },
  field: { marginBottom: 16 },
  spaced: { marginTop: 10 },
});
