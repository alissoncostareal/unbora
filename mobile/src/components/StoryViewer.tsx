import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CarouselItem } from '@/api/carousels';
import { radius, spacing, type ThemeColors } from '@/theme/colors';
import type { StoryItem } from '@/utils/stories';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION_MS = 5500;

function getCtaLabel(story: StoryItem): string {
  const tag = story.tag.toLowerCase();
  if (story.source === 'organic' || tag.includes('dica') || tag.includes('unbora')) {
    return 'Explorar no mapa';
  }
  if (tag.includes('evento') || tag.includes('show') || tag.includes('festa')) {
    return 'Ver evento';
  }
  if (tag.includes('gastro') || tag.includes('café') || tag.includes('food')) {
    return 'Ver no mapa';
  }
  return 'Como chegar';
}

function isSponsoredStory(story: StoryItem): boolean {
  if (story.source === 'organic') return false;
  if (story.source === 'sponsored') return true;
  return !['unbora', 'comunidade', 'dica'].some((word) =>
    story.tag.toLowerCase().includes(word),
  );
}

export function StoryViewer({
  colors,
  items,
  initialIndex,
  visible,
  onClose,
  onStorySeen,
}: {
  colors: ThemeColors;
  items: StoryItem[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onStorySeen: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  const story = items[index];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    if (index >= items.length - 1) {
      onClose();
      return;
    }
    setIndex((current) => current + 1);
  }, [index, items.length, onClose]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setIndex((current) => current - 1);
  }, [index]);

  useEffect(() => {
    if (!visible) {
      clearTimer();
      setPaused(false);
      return;
    }
    setIndex(initialIndex);
  }, [visible, initialIndex, clearTimer]);

  useEffect(() => {
    if (!visible || !story) return;

    onStorySeen(story.id);
    setProgress(0);
    setPaused(false);
    elapsedRef.current = 0;
    startedAtRef.current = Date.now();
  }, [visible, story?.id, index, onStorySeen, story]);

  useEffect(() => {
    if (!visible || !story) return;

    clearTimer();

    if (paused) {
      elapsedRef.current += Date.now() - startedAtRef.current;
      return;
    }

    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startedAtRef.current);
      const next = Math.min(elapsed / STORY_DURATION_MS, 1);
      setProgress(next);
      if (next >= 1) {
        clearTimer();
        goNext();
      }
    }, 50);

    return clearTimer;
  }, [visible, story, paused, index, clearTimer, goNext]);

  const openMaps = () => {
    if (!story) return;
    const query = `${story.title} ${story.city || 'Fortaleza'}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => undefined);
  };

  if (!story) return null;

  const ctaLabel = getCtaLabel(story);
  const isSponsored = isSponsoredStory(story);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <ImageBackground
          source={{ uri: story.imageUrl }}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />

          <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
            <View style={styles.progressRow}>
              {items.map((item, itemIndex) => (
                <View
                  key={item.id}
                  style={[
                    styles.progressTrack,
                    { backgroundColor: 'rgba(255,255,255,0.35)' },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width:
                          itemIndex < index
                            ? '100%'
                            : itemIndex === index
                              ? `${progress * 100}%`
                              : '0%',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaLeft}>
                <View style={styles.thumbWrap}>
                  <ImageBackground
                    source={{ uri: story.imageUrl }}
                    style={styles.thumb}
                    imageStyle={styles.thumbImage}
                  />
                </View>
                <View>
                  <Text style={styles.metaTag}>{story.tag || 'Destaque'}</Text>
                  <Text style={styles.metaTitle} numberOfLines={1}>
                    {story.title}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color="#FFF" />
              </Pressable>
            </View>
          </View>

          <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.title}>{story.title}</Text>
            <Text style={styles.subtitle}>{story.subtitle}</Text>

            <View style={styles.actionsRow}>
              {isSponsored ? (
                <View style={styles.sponsoredBadge}>
                  <Text style={styles.sponsoredText}>Patrocinado</Text>
                </View>
              ) : (
                <View style={styles.curatedBadge}>
                  <Text style={styles.sponsoredText}>Unbora</Text>
                </View>
              )}

              <Pressable
                onPressIn={() => setPaused(true)}
                onPressOut={() => setPaused(false)}
                onPress={openMaps}
                style={({ pressed }) => [
                  styles.ctaButton,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Ionicons name="navigate-outline" size={16} color="#262626" />
                <Text style={styles.ctaLabel}>{ctaLabel}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.tapLeft}
            onPress={goPrev}
            onLongPress={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
          />
          <Pressable
            style={styles.tapRight}
            onPress={goNext}
            onLongPress={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
          />
        </ImageBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  top: {
    paddingHorizontal: spacing.md,
    zIndex: 2,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  thumbWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbImage: {
    borderRadius: 18,
  },
  metaTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    maxWidth: SCREEN_WIDTH - 120,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 3,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sponsoredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  curatedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 165, 233, 0.45)',
  },
  sponsoredText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: '#FFF',
  },
  ctaLabel: {
    color: '#262626',
    fontSize: 14,
    fontWeight: '700',
  },
  tapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 120,
    width: '35%',
    zIndex: 1,
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 120,
    width: '65%',
    zIndex: 1,
  },
});
