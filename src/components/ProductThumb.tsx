import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import Icon from '@/components/Icon';
import { packageBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  uri?: string | null;
  size: number;
  radius?: number;
}

// Product picture with a themed border. Shows a package icon when there is no image or it fails to load.
export default function ProductThumb({ uri, size, radius = 10 }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
        },
      ]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <Icon source={packageBold} size={Math.round(size * 0.4)} color={colors.textMuted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
