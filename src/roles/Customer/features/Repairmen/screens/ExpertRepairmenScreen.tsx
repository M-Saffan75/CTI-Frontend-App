import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, heartExtra, shieldBold, shoppingCartExtra, starExtra } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { REPAIRMEN } from '../data/repairmen';

function RepairmanCard({ repairman }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: repairman.photo }} style={styles.photo} />

      <View style={styles.cardBody}>
        <Text style={[styles.name, { color: colors.text }]}>{repairman.name}</Text>

        <View style={[styles.locationPill, { borderColor: colors.border }]}>
          <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
            {repairman.location}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Icon source={shieldBold} size={13} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Specialty{repairman.experience}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Icon source={starExtra} size={13} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {repairman.rating} Ratings
          </Text>
        </View>

        <View style={styles.actions}>
          <Text style={[styles.viewProfile, { color: colors.text }]}>View Profile</Text>
          <Button title="Book Profile" size="sm" style={styles.bookButton} />
        </View>
      </View>
    </View>
  );
}

export default function ExpertRepairmenScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <View>
            <Icon source={heartExtra} size={24} color={colors.text} />
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
          <Icon source={shoppingCartExtra} size={24} color={colors.text} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>
          Expert Repairmen <Text style={{ color: colors.textMuted }}>({REPAIRMEN.length})</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Showing results based on your location and filters
        </Text>

        <View style={styles.grid}>
          {REPAIRMEN.map((repairman, index) => (
            <FadeUp
              key={repairman.id}
              delay={80 + index * 50}
              duration={500}
              style={styles.gridItem}>
              <RepairmanCard repairman={repairman} />
            </FadeUp>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 9, color: '#FFFFFF' },

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 16 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  gridItem: { width: '48%', marginBottom: 14 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  photo: { width: '100%', height: 110 },
  cardBody: { padding: 10, gap: 6 },
  name: { fontFamily: fonts.bold, fontSize: 14 },
  locationPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  locationText: { fontFamily: fonts.regular, fontSize: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: fonts.regular, fontSize: 11 },
  actions: { gap: 8, marginTop: 4 },
  viewProfile: { fontFamily: fonts.medium, fontSize: 12 },
  bookButton: { alignSelf: 'stretch' },
});
