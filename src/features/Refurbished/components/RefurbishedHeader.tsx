import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { ctiLogo } from '@/assets/images';
import {
  arrowLeftBold,
  filterBold,
  heartExtra,
  menuBold,
  shoppingCartExtra,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';

interface RefurbishedHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showActions?: boolean;
  onFilterPress?: () => void;
  onWishlistPress?: () => void;
  onCartPress?: () => void;
  onMenuPress?: () => void;
}

export default function RefurbishedHeader({
  showBack = false,
  onBack,
  showActions = true,
  onFilterPress,
  onWishlistPress,
  onCartPress,
  onMenuPress,
}: RefurbishedHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleWishlist = () => {
    if (onWishlistPress) {
      onWishlistPress();
    } else {
      try {
        navigation.navigate('Wishlist');
      } catch {}
    }
  };

  const handleCart = () => {
    if (onCartPress) {
      onCartPress();
    } else {
      try {
        navigation.navigate('Cart');
      } catch {}
    }
  };

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      try {
        navigation.navigate('Settings');
      } catch {}
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.background,
          borderBottomColor: colors.border + '22',
        },
      ]}>
      <View style={styles.contentRow}>
        {showBack ? (
          <Squeeze onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color="#FFFFFF" />
          </Squeeze>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              try {
                navigation.navigate('Home');
              } catch {}
            }}>
            <Image source={ctiLogo} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
        )}

        {showActions && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleWishlist}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}>
              <Icon source={heartExtra} size={22} color={colors.text} />
            </TouchableOpacity>

            {onFilterPress && (
              <TouchableOpacity
                onPress={onFilterPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.actionBtn}>
                <Icon source={filterBold} size={20} color={colors.text} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleCart}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}>
              <Icon source={shoppingCartExtra} size={22} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMenu}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}>
              <Icon source={menuBold} size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  logo: {
    width: 140,
    height: 36,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
});
