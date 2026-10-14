import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type TabIconName = 'home' | 'explore' | 'ratings' | 'profile';

export const TAB_LABELS: Record<TabIconName, string> = {
  home: 'Início',
  explore: 'Explorar',
  ratings: 'Avaliações',
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
          <Path
            d="M12 2.5l2.9 6.2 6.8.9-5 4.7 1.3 6.7-6-3.3-6 3.3 1.3-6.7-5-4.7 6.8-.9L12 2.5z"
            fill={focused ? color : 'none'}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
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
