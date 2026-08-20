import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleIcon,
  clockBold,
  commentDotsBold,
  flagBold,
  returnOfInvestmentIcon,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import RepairmanTabs from '../../../components/RepairmanTabs';
import Select from '../../../components/Select';
import CreateDisputeModal from '../components/CreateDisputeModal';
import UpSellModal from '../components/UpSellModal';
import { getMyJobById, MY_JOBS, UPDATE_STATUSES } from '../data/jobs';

function OverviewRow({ label, value, muted = false }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.overviewRow, muted && { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.overviewValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function MyJobDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const job = getMyJobById(route.params?.jobId) ?? MY_JOBS[0];

  const [newStatus, setNewStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [upSellOpen, setUpSellOpen] = useState(false);
  const [history, setHistory] = useState([
    { label: 'Job confirmed', date: job.scheduled },
  ]);

  const updateStatus = () => {
    if (!newStatus) return;
    setHistory(current => [{ label: newStatus, date: new Date().toLocaleDateString() }, ...current]);
    setNewStatus(null);
    setNotes('');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <RepairmanTabs activeTab="MyJobs" onChange={tab => navigation.navigate('Home', { tab })} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Squeeze onPress={() => navigation.goBack()} scale={0.95} style={styles.backWrap}>
          <Icon source={arrowLeftBold} size={16} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back to Job</Text>
        </Squeeze>

        <FadeUp delay={60} duration={450}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>Job Details</Text>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: colors.success + '22' }]}>
                <Text style={[styles.pillText, { color: colors.success }]}>{job.currentStatus}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>Job posting</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Manage and update job status</Text>
        </FadeUp>

        <FadeUp delay={100} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Job Overview</Text>
            <OverviewRow label="Total Amount" value={`TRY ${job.totalAmount.toLocaleString()}`} muted />
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>Device Information</Text>
            <OverviewRow label="Brand:" value={job.brand} />
            <OverviewRow label="Model:" value={job.model} />
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>Booking Detail</Text>
            <OverviewRow label="Scheduled:" value={job.scheduled} />
            <OverviewRow label="Base Price:" value={`TRY ${job.basePrice}`} />
            <OverviewRow label="Parts Price:" value={`TRY ${job.partsPrice.toLocaleString()}`} />
            <OverviewRow label="Service Charge:" value={`TRY ${job.serviceCharge}`} />
          </View>
        </FadeUp>

        <FadeUp delay={140} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Update Status</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>Select New Status</Text>
            <Select placeholder="Choose a status" value={newStatus} options={UPDATE_STATUSES} onChange={setNewStatus} />

            <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>Notes (Optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about the status update..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />

            <Button title="Update Status" disabled={!newStatus} onPress={updateStatus} style={styles.spaced} />
          </View>
        </FadeUp>

        <FadeUp delay={180} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Actions</Text>
            <Button
              title="Chat with Customer"
              icon={commentDotsBold}
              iconPosition="left"
              onPress={() => navigation.navigate('ChatList')}
              style={styles.spaced}
            />
            <Button
              title="Create disputed"
              variant="soft"
              icon={flagBold}
              iconPosition="left"
              onPress={() => setDisputeOpen(true)}
              style={styles.spaced}
            />
            <Button
              title="UpSell"
              variant="soft"
              icon={returnOfInvestmentIcon}
              iconPosition="left"
              onPress={() => setUpSellOpen(true)}
              style={styles.spaced}
            />
          </View>
        </FadeUp>

        <FadeUp delay={220} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tracking</Text>
            <View style={styles.trackingRow}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Current Status:</Text>
              <View style={[styles.pill, { backgroundColor: colors.success + '22' }]}>
                <Text style={[styles.pillText, { color: colors.success }]}>{job.currentStatus}</Text>
              </View>
            </View>
            <View style={styles.trackingRow}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Est. Completion:</Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>{job.estCompletion}</Text>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={260} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Timeline</Text>
            {history.map((event, index) => (
              <View key={index} style={styles.timelineRow}>
                <Icon source={checkCircleIcon} size={16} color={colors.success} />
                <Text style={[styles.timelineLabel, { color: colors.text }]}>{event.label}</Text>
                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{event.date}</Text>
              </View>
            ))}
          </View>
        </FadeUp>

        <FadeUp delay={300} duration={450}>
          <View style={[styles.card, styles.warrantyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Warranty</Text>
            <View style={styles.warrantyRow}>
              <Icon source={clockBold} size={14} color={colors.primary} />
              <Text style={[styles.warrantyText, { color: colors.primary }]}>{job.warrantyDays} days</Text>
            </View>
          </View>
        </FadeUp>
      </ScrollView>

      <CreateDisputeModal visible={disputeOpen} onClose={() => setDisputeOpen(false)} onSubmit={() => setDisputeOpen(false)} />
      <UpSellModal visible={upSellOpen} onClose={() => setUpSellOpen(false)} onSubmit={() => setUpSellOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  backWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.bold, fontSize: 14 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  pillRow: { flexDirection: 'row', gap: 6 },
  pill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 10 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, marginBottom: 10 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, marginTop: 6, marginBottom: 4 },

  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  overviewLabel: { fontFamily: fonts.regular, fontSize: 13 },
  overviewValue: { fontFamily: fonts.bold, fontSize: 13 },

  label: { fontFamily: fonts.regular, fontSize: 13, marginBottom: 8 },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  spaced: { marginTop: 12 },

  trackingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  timelineLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },
  timelineDate: { fontFamily: fonts.regular, fontSize: 12 },

  warrantyCard: { marginBottom: 10 },
  warrantyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warrantyText: { fontFamily: fonts.bold, fontSize: 14 },
});
