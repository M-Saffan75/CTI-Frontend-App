import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { closeIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { privacyPolicy } from '../content/privacyPolicy';

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderColor: colors.border }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.85} style={styles.close}>
          <Icon source={closeIcon} size={18} color={colors.text} />
        </Squeeze>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{privacyPolicy.title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        {privacyPolicy.sections.map((section, index) => (
          <FadeUp key={section.title} delay={100 + index * 60} duration={600}>
            <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.number, { backgroundColor: colors.primary + '26' }]}>
                <Text style={[styles.numberText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            </View>

            <View style={styles.blocks}>
              {section.blocks.map((block, blockIndex) =>
                block.list ? (
                  <View key={blockIndex} style={styles.list}>
                    {block.list.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.listItem}>
                        <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                        <Text style={[styles.text, { color: colors.textMuted }]}>
                          {item.bold && (
                            <Text style={{ fontFamily: fonts.bold, color: colors.text }}>
                              {item.bold}{' '}
                            </Text>
                          )}
                          {item.text ?? item}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text key={blockIndex} style={[styles.text, { color: colors.textMuted }]}>
                    {block.text}
                  </Text>
                ),
              )}
              </View>
            </View>
          </FadeUp>
        ))}

        <FadeUp delay={100 + privacyPolicy.sections.length * 60} duration={600}>
          <View style={[styles.footer, { backgroundColor: colors.primary + '1A' }]}>
            <Text style={[styles.footerTitle, { color: colors.text }]}>
              {privacyPolicy.footer.title}
            </Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>
              {privacyPolicy.footer.text}
              <Text style={{ fontFamily: fonts.bold, color: colors.primary }}>
                {privacyPolicy.footer.link}
              </Text>
            </Text>
          </View>
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  close: { position: 'absolute', left: 20, bottom: 12, zIndex: 1 },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, textAlign: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 22 },
  section: { marginBottom: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontFamily: fonts.bold, fontSize: 11 },
  sectionTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  blocks: { gap: 10, marginTop: 10, paddingLeft: 30 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  list: { gap: 8 },
  listItem: { flexDirection: 'row', gap: 9 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 8 },
  footer: { borderRadius: 12, padding: 16, gap: 6, marginTop: 4 },
  footerTitle: { fontFamily: fonts.bold, fontSize: 14 },
});
