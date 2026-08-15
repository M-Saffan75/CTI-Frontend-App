import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { CHATS } from '../data/chats';

function ChatRow({ chat, navigation }) {
  const { colors } = useTheme();

  return (
    <Squeeze onPress={() => navigation.navigate('ChatDetail', { chatId: chat.id })}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: chat.avatar }} style={styles.avatar} />
          {chat.online && (
            <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.background }]} />
          )}
        </View>

        <View style={styles.rowBody}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1}>
            {chat.lastMessage}
          </Text>
        </View>

        <View style={styles.rowMeta}>
          <Text style={[styles.time, { color: colors.success }]}>{chat.time}</Text>
          {chat.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.unreadText}>{chat.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Squeeze>
  );
}

export default function ChatListScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = CHATS.filter(chat => chat.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.headRow}>
          <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
            <View style={[styles.back, { backgroundColor: colors.primary }]}>
              <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
            </View>
          </Squeeze>

          <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
            <Icon source={searchBold} size={16} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search order custom product"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Chats ({CHATS.length})</Text>

        <View style={styles.list}>
          {filtered.map((chat, index) => (
            <FadeUp key={chat.id} delay={40 + index * 40} duration={400}>
              <ChatRow chat={chat} navigation={navigation} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </FadeUp>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20 },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },

  title: { fontFamily: fonts.bold, fontSize: 22, marginTop: 20, marginBottom: 6 },

  list: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  rowBody: { flex: 1, gap: 3 },
  name: { fontFamily: fonts.bold, fontSize: 15 },
  lastMessage: { fontFamily: fonts.regular, fontSize: 13 },
  rowMeta: { alignItems: 'flex-end', gap: 6 },
  time: { fontFamily: fonts.medium, fontSize: 12 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { fontFamily: fonts.bold, fontSize: 11, color: '#FFFFFF' },
  divider: { height: 1 },
});
