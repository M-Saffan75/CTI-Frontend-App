import { Image } from 'react-native';

/**
 * A plain <Image> with icon-shaped defaults. Nothing more.
 *
 *   import { eyeBold } from '@/assets/icons';
 *   <Icon source={eyeBold} size={20} color={colors.textMuted} />
 *
 * `color` maps to tintColor, which recolours the PNG at render time — the icon
 * files are transparent, so one file works in any colour. Leave `color` off for
 * artwork that should keep its own colours (photos, the profile placeholder).
 */
export default function Icon({ source, size = 24, color = null, style = null, ...rest }) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[{ width: size, height: size }, color && { tintColor: color }, style]}
      {...rest}
    />
  );
}
