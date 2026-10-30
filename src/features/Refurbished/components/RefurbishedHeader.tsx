import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { fonts } from '@/theme/fonts';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import { useCart } from '@/roles/Customer/context/CartContext';

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
  showActions = true,
  onFilterPress,
  onWishlistPress,
  onCartPress,
  onMenuPress,
}: RefurbishedHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { ids: wishlistIds } = useWishlist();
  const { cartCount } = useCart();

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
          paddingTop: insets.top + 8,
          backgroundColor: colors.background,
          borderBottomColor: colors.border + '22',
        },
      ]}>
      <View style={styles.contentRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            try {
              navigation.navigate('Home');
            } catch {}
          }}>
          <Image source={ctiLogo} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>

        {showActions && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleWishlist}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}>
              <View style={styles.iconWithBadge}>
                <Icon source={heartExtra} size={22} color={colors.text} />
                {wishlistIds.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>
                      {wishlistIds.length > 99 ? '99+' : wishlistIds.length}
                    </Text>
                  </View>
                )}
              </View>
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
              <View style={styles.iconWithBadge}>
                <Icon source={shoppingCartExtra} size={22} color={colors.text} />
                {cartCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
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
    paddingHorizontal: 20,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 110,
    height: 59,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  iconWithBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bold,
    textAlign: 'center',
    lineHeight: 11,
  },
});
