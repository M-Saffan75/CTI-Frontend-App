import Avatar from '@/components/Avatar';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  name: string;
  photo?: string | null;
  size?: number;
}

// Photo when there is one, otherwise the first letter of the name. Always has the themed avatar border.
export default function InitialsAvatar({ name, photo, size = 42 }: Props) {
  const { colors } = useTheme();
  return (
    <Avatar
      uri={photo}
      name={name}
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: colors.avatarBorder, backgroundColor: colors.surfaceAlt }}
    />
  );
}
