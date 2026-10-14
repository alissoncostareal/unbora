import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type TabIconName = 'home' | 'explore' | 'ratings' | 'profile';

export const TAB_LABELS: Record<TabIconName, string> = {
  home: 'Início',
  explore: 'Explorar',
  ratings: 'Passaporte',
  profile: 'Perfil',
};

/**
 * Ícones editoriais do Unbora — traços limpos, geometria refinada, sem estilo de rede social.
 */
export function EditorialTabIcon({
  name,
  focused,
  color,
  size = 22,
}: {
  name: TabIconName;
  focused: boolean;
  color: string;
  size?: number;
}) {
  const strokeWidth = focused ? 2.2 : 1.7;

  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {focused ? (
            <>
              <Path
                d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
                fill={color}
              />
            </>
          ) : (
            <Path
              d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      );

    case 'explore':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="11"
            cy="11"
            r="7"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M20 20L16.2 16.2"
            stroke={color}
            strokeWidth={strokeWidth + 0.3}
            strokeLinecap="round"
          />
          {focused ? (
            <Circle cx="11" cy="11" r="3" fill={color} />
          ) : null}
        </Svg>
      );

    case 'ratings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="4"
            y="3"
            width="16"
            height="18"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx="12"
            cy="11"
            r="3.5"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={focused ? color : 'none'}
          />
          <Path
            d="M8 17h8"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />
        </Svg>
      );

    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="8"
            r="4"
            fill={focused ? color : 'none'}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M4.5 20.5c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    default:
      return null;
  }
}
