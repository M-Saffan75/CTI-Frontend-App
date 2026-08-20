import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  calendarBold,
  checkCircleIcon,
  clockBold,
  couponBold,
  eyeBold,
  fileBold,
  mapPinBold,
  mobileBold,
  settingsBold,
  userBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import RepairmanTabs from '../../../components/RepairmanTabs';
import { getJobBoardById, JOB_BOARD } from '../data/jobs';

function InfoBox({ icon, label, value }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.infoBox, { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}>
        <Icon source={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function JobBoardDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const job = getJobBoardById(route.params?.jobId) ?? JOB_BOARD[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <RepairmanTabs activeTab="JobBoard" onChange={tab => navigation.navigate('Home', { tab })} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.95} style={styles.backWrap}>
          <Icon source={arrowLeftBold} size={16} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back to Job</Text>
        </Squeeze>

        <FadeUp delay={60} duration={450}>
          <View style={styles.titleRow}>
            <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
              <Icon source={mobileBold} size={18} color={colors.primary} />
            </View>
            <View style={styles.titleText}>
              <Text style={[styles.deviceName, { color: colors.text }]}>{job.device}</Text>
              <Text style={[styles.warrantyText, { color: colors.textMuted }]}>{job.warranty}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.success + '22' }]}>
              <Text style={[styles.statusText, { color: colors.success }]}>{job.status}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Icon source={clockBold} size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.postedDaysAgo} Days ago</Text>
            </View>
            <View style={styles.metaPill}>
              <Icon source={mapPinBold} size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.postedDaysAgo} Days ago</Text>
            </View>
            <View style={[styles.priorityPill, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.priorityText, { color: colors.primary }]}>{job.priority}</Text>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={100} duration={450}>
          <View style={styles.infoGrid}>
            <InfoBox icon={mobileBold} label="BUDGET RANGE" value={job.budgetRange} />
            <InfoBox icon={calendarBold} label="PREFERRED DATE" value={job.preferredDate} />
            <InfoBox icon={fileBold} label="TOTAL OFFERS" value={`${job.totalOffers}/${job.offerLimit}`} />
            <InfoBox icon={eyeBold} label="VIEWS" value={job.views} />
          </View>
        </FadeUp>

        <FadeUp delay={140} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={fileBold} size={16} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Job Description</Text>
            </View>
            <Text style={[styles.cardText, { color: colors.textMuted }]}>{job.description}</Text>
          </View>
        </FadeUp>

        <FadeUp delay={180} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={settingsBold} size={16} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Requested Services</Text>
            </View>
            {job.requestedServices.map(service => (
              <View key={service.name} style={[styles.serviceRow, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                <Text style={[styles.serviceDescription, { color: colors.textMuted }]}>{service.description}</Text>
              </View>
            ))}
          </View>
        </FadeUp>

        <FadeUp delay={220} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={mapPinBold} size={16} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Location</Text>
            </View>
            <View style={[styles.serviceRow, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.locationText, { color: colors.primary }]}>{job.location}</Text>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={260} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={userBold} size={16} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>About the Client</Text>
            </View>
            <View style={[styles.clientRow, { backgroundColor: colors.surfaceAlt }]}>
              <View style={[styles.clientAvatar, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.clientInitial, { color: colors.primary }]}>{job.client.name[0]}</Text>
              </View>
              <View style={styles.clientInfo}>
                <View style={styles.clientNameRow}>
                  <Text style={[styles.clientName, { color: colors.text }]}>{job.client.name}</Text>
                  {job.client.verified && <Icon source={checkCircleIcon} size={14} color={colors.success} />}
                </View>
                <Text style={[styles.serviceDescription, { color: colors.textMuted }]}>
                  {job.requestedServices[0]?.description}
                </Text>
              </View>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={300} duration={450}>
          <Button
            title="Send proposal"
            icon={couponBold}
            iconPosition="left"
            onPress={() => navigation.navigate('SendProposal', { jobId: job.id })}
            style={styles.sendButton}
          />
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  backWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.bold, fontSize: 14 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  deviceIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titleText: { flex: 1 },
  deviceName: { fontFamily: fonts.bold, fontSize: 18 },
  warrantyText: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  statusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontFamily: fonts.bold, fontSize: 12 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 12 },
  priorityPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontFamily: fonts.bold, fontSize: 11 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  infoBox: { width: '48%', borderRadius: 12, padding: 12, gap: 6 },
  infoIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.4 },
  infoValue: { fontFamily: fonts.bold, fontSize: 14 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  cardText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },

  serviceRow: { borderRadius: 10, padding: 12, gap: 4 },
  serviceName: { fontFamily: fonts.bold, fontSize: 13 },
  serviceDescription: { fontFamily: fonts.regular, fontSize: 12 },
  locationText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19 },

  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 12 },
  clientAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  clientInitial: { fontFamily: fonts.bold, fontSize: 15 },
  clientInfo: { flex: 1, gap: 2 },
  clientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientName: { fontFamily: fonts.bold, fontSize: 14 },

  sendButton: { marginTop: 20 },
});
