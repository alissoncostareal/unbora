import Svg, { Circle, Path } from 'react-native-svg';

type TabIconName = 'home' | 'search' | 'notifications' | 'favorites' | 'profile';

/**
 * Ícones no formato Instagram: traço ~2px arredondado quando inativo,
 * silhueta preenchida quando ativo.
 */
export function InstagramTabIcon({
  name,
  focused,
  color,
  size = 26,
}: {
  name: TabIconName;
  focused: boolean;
  color: string;
  size?: number;
}) {
  const stroke = 1.9;

  switch (name) {
    case 'home':
      return focused ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M2.5 10.8 12 2.8l9.5 8v10.4a1.3 1.3 0 0 1-1.3 1.3H14.2v-6.2h-4.4v6.2H3.8a1.3 1.3 0 0 1-1.3-1.3V10.8Z"
            fill={color}
          />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3.2 10.6 12 3.2l8.8 7.4v9.3c0 .8-.6 1.4-1.4 1.4h-4.7v-5.8h-5.4v5.8H4.6c-.8 0-1.4-.6-1.4-1.4v-9.3Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'search':
      return focused ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="10.5" cy="10.5" r="6.2" fill={color} />
          <Path
            d="M15.4 15.4 20.2 20.2"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Circle cx="10.5" cy="10.5" r="3.6" fill={isDarkFill(color)} />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="10.5"
            cy="10.5"
            r="6.2"
            stroke={color}
            strokeWidth={stroke}
          />
          <Path
            d="M15.4 15.4 20.2 20.2"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'notifications':
      return focused ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2.6c-3.6 0-6.4 2.8-6.4 6.5v3.1c0 .7-.3 1.4-.8 1.9l-1.1 1.1c-.7.7-.2 1.9.8 1.9h15c1 0 1.5-1.2.8-1.9l-1.1-1.1c-.5-.5-.8-1.2-.8-1.9V9.1c0-3.7-2.8-6.5-6.4-6.5Z"
            fill={color}
          />
          <Path
            d="M9.4 18.4a2.6 2.6 0 0 0 5.2 0"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.2c-3.2 0-5.8 2.5-5.8 5.8v3.3c0 .8-.3 1.5-.9 2.1l-.9.9c-.5.5-.1 1.4.7 1.4h13.8c.8 0 1.2-.9.7-1.4l-.9-.9c-.5-.6-.9-1.3-.9-2.1V9c0-3.3-2.6-5.8-5.8-5.8Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Path
            d="M9.6 18.2a2.4 2.4 0 0 0 4.8 0"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'favorites':
      return focused ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12.1 20.7S3.4 15.2 3.4 9.4A4.7 4.7 0 0 1 12.1 6a4.7 4.7 0 0 1 8.7 3.4c0 5.8-8.7 11.3-8.7 11.3Z"
            fill={color}
          />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12.1 20.2S3.8 15 3.8 9.5A4.3 4.3 0 0 1 12.1 6.4a4.3 4.3 0 0 1 8.3 3.1c0 5.5-8.3 10.7-8.3 10.7Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'profile':
      return focused ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9.2" fill={color} />
          <Circle cx="12" cy="9.2" r="3.1" fill={isDarkFill(color)} />
          <Path
            d="M5.8 18.2c1.5-2.4 3.7-3.6 6.2-3.6s4.7 1.2 6.2 3.6"
            stroke={isDarkFill(color)}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.8" stroke={color} strokeWidth={stroke} />
          <Circle cx="12" cy="9.4" r="2.8" stroke={color} strokeWidth={stroke} />
          <Path
            d="M6.4 17.8c1.4-2.1 3.3-3.2 5.6-3.2s4.2 1.1 5.6 3.2"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );

    default:
      return null;
  }
}

/** Contraste interno do avatar preenchido (claro/escuro). */
function isDarkFill(color: string): string {
  const normalized = color.toLowerCase();
  if (normalized === '#f5f5f5' || normalized === '#ffffff' || normalized === '#fff') {
    return '#121212';
  }
  return '#FFFFFF';
}

export const TAB_ICON_NAMES: Record<string, TabIconName> = {
  index: 'home',
  explore: 'search',
  notifications: 'notifications',
  favorites: 'favorites',
  profile: 'profile',
};
