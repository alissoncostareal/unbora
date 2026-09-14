import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';

import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import type { ThemeColors } from '@/theme/colors';
import { log, shortUrl } from '@/utils/log';

/**
 * Capas via URL do proxy do backend (/api/media/p/{id}).
 * Preferir EXPO_PUBLIC_API_BASE_URL em HTTPS em produção;
 * em local HTTP, cleartext já está liberado no app.json.
 * Cache: expo-image (memory-disk).
 */
export function RemoteCoverImage({
  colors,
  uri,
  label,
  style,
}: {
  colors: ThemeColors;
  uri?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const trimmed = uri?.trim() || '';
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    if (!trimmed) {
      log.warn('cover', `sem URL — placeholder (${label ?? 'sem label'})`);
    } else {
      log.debug('cover', `url ${shortUrl(trimmed)} (${label ?? ''})`);
    }
  }, [trimmed, label]);

  const showImage = Boolean(trimmed) && !failed;

  return (
    <View style={[styles.root, style]}>
      {!loaded || !showImage ? (
        <CoverPlaceholder colors={colors} label={label} style={StyleSheet.absoluteFill} />
      ) : null}
      {showImage ? (
        <Image
          source={{ uri: trimmed }}
          style={[styles.image, !loaded && styles.hidden]}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={trimmed}
          transition={180}
          onLoad={() => {
            setLoaded(true);
            log.debug('cover', `render ok ${label ?? ''}`, {
              url: shortUrl(trimmed),
            });
          }}
          onError={(event) => {
            log.error('cover', 'Image.onError', {
              label,
              url: shortUrl(trimmed),
              error: event.error,
            });
            setFailed(true);
            setLoaded(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#DCE8EA',
  },
  image: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  hidden: {
    opacity: 0,
  },
});
