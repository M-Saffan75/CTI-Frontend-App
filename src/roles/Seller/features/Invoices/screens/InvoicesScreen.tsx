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

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { downloadBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

interface InvoiceItem {
  id: string;
  code: string;
  submittedDate: string;
  status: 'Under Review' | 'Approved' | 'Rejected';
  statusColor: string;
  notes: string;
}

const INVOICE_FILTERS = [
  { id: 'All', label: 'All (2)' },
  { id: 'Under Review', label: 'Under Review (2)' },
  { id: 'Approved', label: 'Approved (0)' },
  { id: 'Rejected', label: 'Rejected (0)' },
];

const MOCK_INVOICES: InvoiceItem[] = [
  {
    id: 'inv-2',
    code: 'INV-0000002',
    submittedDate: 'Jul 1,2026,08:06 PM',
    status: 'Under Review',
    statusColor: '#F59E0B',
    notes: '—',
  },
  {
    id: 'inv-1',
    code: 'INV-0000001',
    submittedDate: 'Jul 1,2026,08:00 PM',
    status: 'Under Review',
    statusColor: '#F59E0B',
    notes: '—',
  },
];

export default function InvoicesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [invoices, setInvoices] = useState<InvoiceItem[]>(MOCK_INVOICES);

  const filteredInvoices = invoices.filter(inv => {
    if (selectedFilter === 'All') return true;
    return inv.status === selectedFilter;
  });

  const handleDownload = (code: string) => {
    Alert.alert('Invoice Download', `Downloading ${code}.pdf to your device.`);
  };

  const handleUploadNewInvoice = () => {
    Alert.alert(
      'Upload Invoice PDF',
      'Select a generated tax invoice or sales receipt PDF to submit for administrative clearance.'
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* Top Header matching Invoice screen.png */}
      <FadeUp delay={30} duration={300}>
        <View style={styles.topSection}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Invoices</Text>
          <Text style={[styles.mainSub, { color: colors.textMuted }]}>
            Upload your invoice PDFs for admin review
          </Text>

          {/* Quick Upload action */}
          <Button
            title="+ Upload Invoice PDF"
            variant="outline"
            size="sm"
            onPress={handleUploadNewInvoice}
            style={styles.uploadBtn}
          />
        </View>

        {/* Filter Pills matching Figma */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}>
          {INVOICE_FILTERS.map(pill => {
            const isSelected = selectedFilter === pill.id;
            return (
              <Squeeze key={pill.id} onPress={() => setSelectedFilter(pill.id)}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      { color: isSelected ? colors.onPrimary : colors.textMuted },
                      isSelected && { fontFamily: fonts.bold },
                    ]}>
                    {pill.label}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>
      </FadeUp>

      {/* Invoices List matching Invoice screen.png */}
      <View style={styles.invoicesList}>
        {filteredInvoices.map((inv, idx) => (
          <FadeUp key={inv.id} delay={60 + idx * 40} duration={320}>
            <View
              style={[
                styles.invoiceCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {/* Header: Code & Download Button */}
              <View style={styles.cardHeader}>
                <Text style={styles.invoiceCode}>{inv.code}</Text>
                <TouchableOpacity
                  onPress={() => handleDownload(inv.code)}
                  style={[
                    styles.downloadBtn,
                    { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                  ]}>
                  <Icon source={downloadBold} size={15} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Submitted Date & Status Pill */}
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Submitted:</Text>
                  <Text style={[styles.val, { color: colors.text }]}>{inv.submittedDate}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Status:</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: inv.statusColor + '20', borderColor: inv.statusColor },
                    ]}>
                    <Text style={[styles.statusText, { color: inv.statusColor }]}>
                      • {inv.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Notes:</Text>
                  <Text style={[styles.val, { color: colors.textMuted }]}>{inv.notes}</Text>
                </View>
              </View>
            </View>
          </FadeUp>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  topSection: { gap: 6 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 22 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13 },
  uploadBtn: { alignSelf: 'flex-start', marginTop: 4 },

  filterPillsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13 },

  invoicesList: { gap: 12 },
  invoiceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceCode: {
    color: '#6366F1',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, width: '100%' },

  cardBody: { gap: 8 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontFamily: fonts.regular, fontSize: 13 },
  val: { fontFamily: fonts.medium, fontSize: 13 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontFamily: fonts.medium, fontSize: 12 },
});
