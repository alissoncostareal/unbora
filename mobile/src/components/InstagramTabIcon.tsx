import Svg, { Circle, Path } from 'react-native-svg';

type TabIconName = 'home' | 'search' | 'create' | 'ratings' | 'profile';

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

    case 'create':
      return focused ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z"
            fill={color}
          />
          <Path
            d="M12 8v8M8 12h8"
            stroke={isDarkFill(color)}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.6" stroke={color} strokeWidth={stroke} />
          <Path
            d="M12 8.2v7.6M8.2 12h7.6"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'ratings':
      return focused ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2.8 14.7 9l6.8.6-5.2 4.5 1.6 6.6L12 17.4 6.1 20.7l1.6-6.6L2.5 9.6 9.3 9 12 2.8Z"
            fill={color}
          />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.4 14.5 9l6.2.5-4.7 4.1 1.4 6.1L12 16.7 6.6 19.7l1.4-6.1L3.3 9.5 9.5 9 12 3.4Z"
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
  create: 'create',
  ratings: 'ratings',
  profile: 'profile',
};
