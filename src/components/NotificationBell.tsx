import { StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { bellBold } from '@/assets/icons';
import { useUnreadNotifications } from '@/services/unreadStore';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

// The bell in the headers of every role, with the number of unread notifications
export default function NotificationBell({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const unread = useUnreadNotifications();

  return (
    <Squeeze onPress={() => navigation?.navigate('Notifications')} scale={0.85}>
      <View>
        <Icon source={bellBold} size={22} color={colors.text} />
        {unread > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.background }]}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </View>
    </Squeeze>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -7,
    right: -9,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontFamily: fonts.bold },
});
