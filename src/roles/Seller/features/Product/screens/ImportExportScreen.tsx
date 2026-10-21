import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  chevronDownBold,
  clockBold,
  downloadBold,
  fileBold,
  infoCircleBold,
  uploadBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const CSV_COLUMNS = [
  { name: 'Title', badge: 'Required', desc: 'Product name (max 300 chars)' },
  { name: 'Short description', badge: 'Optional', desc: 'Short product summary (max 500 chars)' },
  { name: 'Description', badge: 'Required', desc: 'Full product description' },
  { name: 'Category', badge: 'Required', desc: 'Must match an existing subcategory name' },
  { name: 'Sub Category', badge: 'Optional', desc: 'Must match an existing subcategory name' },
];

const HISTORY_ITEMS = [
  {
    id: '1',
    fileName: 'fashion 20 profucts csv',
    date: '27 june 2026 15:32',
    status: 'Partial',
    product: 20,
    imported: 20,
    skipped: 0,
  },
  {
    id: '2',
    fileName: 'fashion_20_products.csv',
    date: '27 june 2026 15:32',
    status: 'Success',
    product: 20,
    imported: 14,
    skipped: 6,
  },
  {
    id: '3',
    fileName: 'fashion_20_products.csv',
    date: '27 june 2026 15:32',
    status: 'Partial',
    product: 20,
    imported: 14,
    skipped: 6,
  },
  {
    id: '4',
    fileName: 'fashion_20_products.csv',
    date: '27 june 2026 15:32',
    status: 'Success',
    product: 20,
    imported: 14,
    skipped: 6,
  },
];

export default function ImportExportScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeSubTab, setActiveSubTab] = useState('Export'); // 'Export' | 'Import' | 'History'
  const [importStep, setImportStep] = useState('1 Required');

  const handleExport = () => {
    Alert.alert('Export Started', '21 products export has been scheduled.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Header with yellow circular back button */}
        <FadeUp delay={20} duration={300}>
          <View style={styles.headerRow}>
            <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
              <View style={[styles.backBtnCircle, { backgroundColor: colors.primary }]}>
                <Icon source={arrowLeftBold} size={18} color="#fff" />
              </View>
            </Squeeze>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Import / Export</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Bulk manage your product catalogue
              </Text>
            </View>
          </View>

          {/* Sub-tab pills matching Figma: [⇆ Expert] [⤓ Import] [⏱ History] */}
          <View style={styles.subTabsRow}>
            <Squeeze onPress={() => setActiveSubTab('Export')}>
              <View
                style={[
                  styles.tabPill,
                  activeSubTab === 'Export'
                    ? { backgroundColor: '#8B5CF6' }
                    : { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 },
                ]}>
                <Icon
                  source={downloadBold}
                  size={14}
                  color={activeSubTab === 'Export' ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    { color: activeSubTab === 'Export' ? '#fff' : colors.text },
                  ]}>
                  Expert
                </Text>
              </View>
            </Squeeze>

            <Squeeze onPress={() => setActiveSubTab('Import')}>
              <View
                style={[
                  styles.tabPill,
                  activeSubTab === 'Import'
                    ? { backgroundColor: '#8B5CF6' }
                    : { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 },
                ]}>
                <Icon
                  source={uploadBold}
                  size={14}
                  color={activeSubTab === 'Import' ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    { color: activeSubTab === 'Import' ? '#fff' : colors.text },
                  ]}>
                  Import
                </Text>
              </View>
            </Squeeze>

            <Squeeze onPress={() => setActiveSubTab('History')}>
              <View
                style={[
                  styles.tabPill,
                  activeSubTab === 'History'
                    ? { backgroundColor: '#8B5CF6' }
                    : { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 },
                ]}>
                <Icon
                  source={clockBold}
                  size={14}
                  color={activeSubTab === 'History' ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    { color: activeSubTab === 'History' ? '#fff' : colors.text },
                  ]}>
                  History
                </Text>
              </View>
            </Squeeze>
          </View>
        </FadeUp>

        {/* TAB 1: EXPORT */}
        {activeSubTab === 'Export' && (
          <FadeUp delay={60} duration={300}>
            {/* Export Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardIconBox}>
                <Icon source={fileBold} size={22} color="#10B981" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Export your products</Text>
              <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                Download a complete CSV of all your products including every variant attribute, spec, image URL pricing inventory category and warranty information.
              </Text>
              <Text style={[styles.highlightText, { color: '#8B5CF6' }]}>
                21 products will be included
              </Text>
              <Squeeze onPress={handleExport}>
                <View style={styles.greenExportBtn}>
                  <Text style={styles.greenBtnText}>Create Product</Text>
                </View>
              </Squeeze>
            </View>

            {/* Blue Info Fidelity Banner */}
            <View style={[styles.blueInfoCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <View style={styles.blueInfoRow}>
                <Icon source={infoCircleBold} size={18} color="#3B82F6" />
                <Text style={[styles.blueInfoTitle, { color: '#1E3A8A' }]}>
                  Perfect round-trip fidelity
                </Text>
              </View>
              <Text style={[styles.blueInfoDesc, { color: '#1E40AF' }]}>
                Export Delete Import will restore your products exactly as they were: all variants attributes specs images pricing and inventory preserved.
              </Text>
            </View>

            {/* CSV Column Reference */}
            <View style={styles.sectionHeadingRow}>
              <Text style={{ fontSize: 16 }}>☰</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Csv column reference
              </Text>
            </View>
            <Text style={[styles.columnSub, { color: colors.textMuted }]}>
              One row per variant; multiple rows share model_number for the same product.
            </Text>

            <View style={styles.columnList}>
              {CSV_COLUMNS.map(col => (
                <View
                  key={col.name}
                  style={[styles.colCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.colHeaderRow}>
                    <Text style={[styles.colName, { color: '#7C3AED' }]}>{col.name}</Text>
                    <View
                      style={[
                        styles.badgePill,
                        col.badge === 'Required'
                          ? { backgroundColor: '#FEE2E2' }
                          : { backgroundColor: colors.surfaceAlt },
                      ]}>
                      <Text
                        style={[
                          styles.badgeText,
                          { color: col.badge === 'Required' ? '#EF4444' : colors.textMuted },
                        ]}>
                        {col.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.colDesc, { color: colors.textMuted }]}>{col.desc}</Text>
                </View>
              ))}
            </View>
          </FadeUp>
        )}

        {/* TAB 2: IMPORT */}
        {activeSubTab === 'Import' && (
          <FadeUp delay={60} duration={300}>
            {/* Step Pills */}
            <View style={styles.stepPillsRow}>
              <View style={[styles.stepPill, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.activeStepText}>1 Required</Text>
              </View>
              <View style={[styles.stepPill, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.inactiveStepText, { color: colors.textMuted }]}>2 Preview</Text>
              </View>
              <View style={[styles.stepPill, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.inactiveStepText, { color: colors.textMuted }]}>3 Import</Text>
              </View>
            </View>

            {/* Upload Box */}
            <View style={[styles.importDashedBox, { borderColor: '#8B5CF6', backgroundColor: colors.surface }]}>
              <Icon source={uploadBold} size={28} color={colors.textMuted} />
              <Text style={[styles.dashedTitle, { color: colors.text, marginTop: 10 }]}>
                Click to upload video
              </Text>
              <Text style={[styles.dashedSub, { color: colors.textMuted }]}>
                MP4, WebM, MOV - up to 50MB each
              </Text>
            </View>

            {/* Multi-variant products Info */}
            <View style={[styles.peachInfoCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <View style={styles.peachInfoRow}>
                <Icon source={infoCircleBold} size={18} color="#D97706" />
                <Text style={[styles.peachInfoTitle, { color: '#92400E' }]}>
                  Multi-variant products
                </Text>
              </View>
              <Text style={[styles.peachInfoDesc, { color: '#B45309' }]}>
                Use the same model_number on multiple rows to create a product with multiple variants. Download the sample CSV to see examples.
              </Text>
            </View>
          </FadeUp>
        )}

        {/* TAB 3: HISTORY */}
        {activeSubTab === 'History' && (
          <FadeUp delay={60} duration={300}>
            <Text style={[styles.historyHeading, { color: colors.text }]}>Import / Export</Text>
            <View style={styles.historyList}>
              {HISTORY_ITEMS.map(item => (
                <View
                  key={item.id}
                  style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.historyTopRow}>
                    <View>
                      <Text style={[styles.historyFileName, { color: colors.text }]}>
                        {item.fileName}
                      </Text>
                      <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                        {item.date}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'Success'
                          ? { backgroundColor: '#ECFDF5' }
                          : { backgroundColor: '#FEF3C7' },
                      ]}>
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: item.status === 'Success' ? '#10B981' : '#D97706' },
                        ]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.historyMetricsRow}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricVal, { color: colors.text }]}>{item.product}</Text>
                      <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Product</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricVal, { color: colors.text }]}>{item.imported}</Text>
                      <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Imported</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricVal, { color: colors.text }]}>{item.skipped}</Text>
                      <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Skipped</Text>
                    </View>
                  </View>

                  <View style={styles.viewDetailRow}>
                    <Text style={[styles.viewDetailText, { color: colors.textMuted }]}>
                      View detail
                    </Text>
                    <Icon source={chevronDownBold} size={12} color={colors.textMuted} />
                  </View>
                </View>
              ))}
            </View>
          </FadeUp>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  subTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  cardDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  highlightText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  greenExportBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  greenBtnText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 13,
  },

  blueInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginTop: 14,
  },
  blueInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blueInfoTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  blueInfoDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  columnSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: -8,
  },

  columnList: {
    gap: 10,
    marginTop: 10,
  },
  colCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colName: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  colDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },

  stepPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  activeStepText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  inactiveStepText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  importDashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 4,
  },
  dashedTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  dashedSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },

  peachInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginTop: 14,
  },
  peachInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peachInfoTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  peachInfoDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },

  historyHeading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginBottom: 10,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  historyFileName: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  historyDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  divider: {
    height: 1,
  },
  historyMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  metricLbl: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  viewDetailText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
