import { Image, Modal, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  kind: 'logo' | 'cover';
  uri?: string;
  uploading: boolean;
  onCancel: () => void;
  onUpload: () => void;
}

export default function PhotoPreviewModal({ visible, kind, uri, uploading, onCancel, onUpload }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isLogo = kind === 'logo';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={uploading ? undefined : onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{isLogo ? t('sellerAuto.newProfilePhoto') : t('sellerAuto.newCoverPhoto')}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t('sellerAuto.checkThePictureThenUpload')}</Text>

          {uri ? (
            <Image
              source={{ uri }}
              style={isLogo ? [styles.logo, { borderColor: colors.avatarBorder }] : styles.cover}
            />
          ) : null}

          <View style={styles.row}>
            <Button title={t('common.cancel')} variant="outline" size="sm" onPress={onCancel} disabled={uploading} style={styles.flex} />
            <Button title={t('sellerAuto.upload')} variant="primary" size="sm" onPress={onUpload} loading={uploading} style={styles.flex} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)', justifyContent: 'center', padding: 20 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12, alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 18 },
  hint: { fontFamily: fonts.regular, fontSize: 12 },
  logo: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, marginVertical: 8 },
  cover: { width: '100%', height: 140, borderRadius: 12, marginVertical: 8 },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  flex: { flex: 1 },
});
