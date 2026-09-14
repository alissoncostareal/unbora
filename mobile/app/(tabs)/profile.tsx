import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AmbientBackground } from '@/components/AmbientBackground';
import { AppHeader } from '@/components/AppHeader';
import {
  FLOATING_TAB_BAR_GAP,
  FLOATING_TAB_BAR_HEIGHT,
} from '@/components/FloatingTabBar';
import { GlassSurface } from '@/components/GlassSurface';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { getInitials, useAuthStore } from '@/stores/authStore';
import { useCheckinsStore, type CheckinItem } from '@/stores/checkinsStore';
import { useLocationStore } from '@/stores/locationStore';
import { useThemeStore } from '@/stores/themeStore';
import {
  getStoryRingColors,
  radius,
  spacing,
  type ThemePreference,
} from '@/theme/colors';
import { useDayTheme } from '@/theme/useDayTheme';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Escuro', icon: 'moon-outline' },
  { value: 'system', label: 'Auto', icon: 'phone-portrait-outline' },
];

const AVATAR_SIZE = 84;
const RING_SIZE = AVATAR_SIZE + 8;

type ProfileTab = 'passport' | 'settings';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, period, scheme } = useDayTheme();
  const isDark = scheme === 'dark';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const city = useLocationStore((s) => s.city);
  const country = useLocationStore((s) => s.country);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const checkins = useCheckinsStore((s) => s.checkins);
  const cities = useCheckinsStore((s) => s.cities);
  const addCheckin = useCheckinsStore((s) => s.addCheckin);
  const removeCheckin = useCheckinsStore((s) => s.removeCheckin);

  const { onScroll, scrollEventThrottle } = useTabBarScroll();

  const [activeTab, setActiveTab] = useState<ProfileTab>('passport');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  // Modal de novo check-in
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeCity, setPlaceCity] = useState(city || 'Fortaleza');
  const [placeCategory, setPlaceCategory] = useState('Gastronomia');
  const [placeNotes, setPlaceNotes] = useState('');

  useEffect(() => {
    setNameInput(user?.name ?? '');
  }, [user?.name]);

  const tabClearance =
    FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP + Math.max(insets.bottom, 8);

  if (!user) {
    return null;
  }

  const roleLabel = user.isGuest
    ? 'Convidado'
    : user.role === 'merchant'
      ? user.businessName || 'Lojista Oficial'
      : 'Membro Unbora';

  const [ringA, ringB, ringC] = getStoryRingColors(period);

  const saveName = async () => {
    const next = nameInput.trim();
    if (!next || next === user.name) {
      setEditingName(false);
      setNameInput(user.name);
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(next);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateCheckin = () => {
    if (!placeName.trim()) {
      Alert.alert('Atenção', 'Informe o nome do lugar visitado.');
      return;
    }

    addCheckin({
      placeName: placeName.trim(),
      city: placeCity.trim() || city,
      state: 'Brasil',
      category: placeCategory,
      date: 'Hoje',
      rating: 4.8,
      icon: 'location-outline',
      notes: placeNotes.trim() || 'Visita registrada no Unbora.',
      imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    });

    setPlaceName('');
    setPlaceNotes('');
    setShowCheckinModal(false);
    Alert.alert('Sucesso', 'Check-in registrado no seu Passaporte Unbora.');
  };

  const confirmLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza de que deseja encerrar a sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ],
    );
  };

  return (
    <AmbientBackground colors={colors}>
      <AppHeader
        colors={colors}
        period={period}
        title="Perfil"
        hideAvatar
      />

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabClearance + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroContainer}>
          <View style={styles.avatarWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="profileRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={ringA} />
                  <Stop offset="50%" stopColor={ringB} />
                  <Stop offset="100%" stopColor={ringC} />
                </LinearGradient>
              </Defs>
              <Rect
                x={1.5}
                y={1.5}
                width={RING_SIZE - 3}
                height={RING_SIZE - 3}
                rx={RING_SIZE / 2}
                stroke="url(#profileRing)"
                strokeWidth={2.5}
                fill="none"
              />
            </Svg>
            <View style={[styles.avatar, { backgroundColor: colors.buttonInk }]}>
              <Text style={[styles.avatarText, { color: colors.buttonInkText }]}>
                {getInitials(user.name)}
              </Text>
            </View>
          </View>

          {editingName && !user.isGuest ? (
            <View style={styles.editNameRow}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                style={[
                  styles.nameInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.primary,
                    backgroundColor: colors.surfaceStrong,
                  },
                ]}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <Pressable
                onPress={saveName}
                disabled={savingName}
                style={[styles.saveNameBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="checkmark" size={18} color="#FFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => !user.isGuest && setEditingName(true)}
              style={styles.nameRow}
            >
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {user.name}
              </Text>
              {!user.isGuest ? (
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={colors.textMuted}
                  style={{ marginLeft: 6 }}
                />
              ) : null}
            </Pressable>
          )}

          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {user.isGuest ? 'Modo visitante anônimo' : user.email}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
                {roleLabel}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
                {city}, {country || 'Brasil'}
              </Text>
            </View>
          </View>
        </View>

        {/* Guest CTA — acima dos stats de lugares/cidades */}
        {user.isGuest ? (
          <GlassSurface
            colors={colors}
            style={styles.guestCard}
            contentStyle={{ padding: spacing.md }}
          >
            <View style={styles.guestContent}>
              <View style={[styles.guestIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestTitle, { color: colors.textPrimary }]}>
                  Sincronize seu passaporte
                </Text>
                <Text style={[styles.guestBody, { color: colors.textMuted }]}>
                  Crie sua conta gratuita para salvar seus check-ins e histórico em qualquer aparelho.
                </Text>
              </View>
            </View>
            <View style={styles.guestActions}>
              <Pressable
                onPress={() => router.push('/register')}
                style={[styles.primaryBtn, { backgroundColor: colors.buttonInk }]}
              >
                <Text style={[styles.primaryBtnLabel, { color: colors.buttonInkText }]}>
                  Criar conta
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/login')}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.secondaryBtnLabel, { color: colors.textPrimary }]}>
                  Entrar
                </Text>
              </Pressable>
            </View>
          </GlassSurface>
        ) : null}

        {/* Stats Row (Check-ins & Cidades) */}
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => setActiveTab('passport')}
            style={({ pressed }) => [
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: activeTab === 'passport' ? colors.primary : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="map-outline" size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {checkins.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Lugares Visitados
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('passport')}
            style={({ pressed }) => [
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: activeTab === 'passport' ? colors.primary : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {cities.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Cidades Exploradas
            </Text>
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.surfaceStrong, borderColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => setActiveTab('passport')}
            style={[
              styles.tabItem,
              activeTab === 'passport' && {
                backgroundColor: colors.surface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              },
            ]}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={activeTab === 'passport' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'passport' ? colors.textPrimary : colors.textMuted,
                  fontWeight: activeTab === 'passport' ? '700' : '500',
                },
              ]}
            >
              Passaporte & Cidades
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('settings')}
            style={[
              styles.tabItem,
              activeTab === 'settings' && {
                backgroundColor: colors.surface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              },
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={16}
              color={activeTab === 'settings' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'settings' ? colors.textPrimary : colors.textMuted,
                  fontWeight: activeTab === 'settings' ? '700' : '500',
                },
              ]}
            >
              Configurações
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: PASSAPORTE & CIDADES */}
        {activeTab === 'passport' && (
          <View style={styles.tabContent}>
            {/* Cidades Visitadas */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Cidades Exploradas
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {cities.length} {cities.length === 1 ? 'cidade registrada' : 'cidades registradas'}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.citiesScroll}
            >
              {cities.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.cityCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: item.isCurrent ? colors.primary : colors.border,
                      borderWidth: item.isCurrent ? 1.5 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <Image source={{ uri: item.coverImage }} style={styles.cityCover} />
                  <View style={styles.cityBadge}>
                    <Text style={styles.cityBadgeText}>{item.badge}</Text>
                  </View>
                  <View style={styles.cityInfo}>
                    <Text style={[styles.cityName, { color: colors.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.cityState, { color: colors.textMuted }]}>
                      {item.state} · {item.country}
                    </Text>
                    <View style={styles.cityCheckinsRow}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={colors.primary} />
                      <Text style={[styles.cityCheckinsCount, { color: colors.primary }]}>
                        {item.checkinsCount} {item.checkinsCount === 1 ? 'check-in' : 'check-ins'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Linha do Tempo de Check-ins */}
            <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Histórico de Check-ins
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  Lugares por onde você já passou
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCheckinModal(true)}
                style={({ pressed }) => [
                  styles.addCheckinBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.addCheckinBtnText}>Novo Check-in</Text>
              </Pressable>
            </View>

            {checkins.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons name="map-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  Nenhum check-in ainda
                </Text>
                <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                  Explore a cidade e registre os restaurantes, bares e atrações que você visitou.
                </Text>
                <Pressable
                  onPress={() => setShowCheckinModal(true)}
                  style={[styles.primaryBtn, { backgroundColor: colors.buttonInk, marginTop: 8 }]}
                >
                  <Text style={[styles.primaryBtnLabel, { color: colors.buttonInkText }]}>
                    Fazer meu primeiro check-in
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.checkinsList}>
                {checkins.map((chk: CheckinItem) => (
                  <GlassSurface
                    key={chk.id}
                    colors={colors}
                    style={styles.checkinCard}
                    contentStyle={styles.checkinCardInner}
                  >
                    {chk.imageUrl ? (
                      <Image source={{ uri: chk.imageUrl }} style={styles.checkinThumb} />
                    ) : (
                      <View
                        style={[
                          styles.checkinThumb,
                          {
                            backgroundColor: colors.surfaceStrong,
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        <Ionicons name="location-outline" size={24} color={colors.textMuted} />
                      </View>
                    )}

                    <View style={styles.checkinBody}>
                      <View style={styles.checkinTopRow}>
                        <Text style={[styles.checkinCategory, { color: colors.primary }]}>
                          {chk.category} · {chk.city}
                        </Text>
                        <Text style={[styles.checkinDate, { color: colors.textMuted }]}>
                          {chk.date}
                        </Text>
                      </View>

                      <Text
                        style={[styles.checkinPlaceName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {chk.placeName}
                      </Text>

                      {chk.notes ? (
                        <Text
                          style={[styles.checkinNotes, { color: colors.textMuted }]}
                          numberOfLines={2}
                        >
                          "{chk.notes}"
                        </Text>
                      ) : null}

                      {chk.rating ? (
                        <View style={styles.checkinRatingRow}>
                          <Ionicons name="star" size={13} color="#F59E0B" />
                          <Text style={[styles.checkinRatingText, { color: colors.textPrimary }]}>
                            {chk.rating.toFixed(1)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => removeCheckin(chk.id)}
                      hitSlop={8}
                      style={styles.deleteCheckinBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  </GlassSurface>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: AJUSTES & CONTA */}
        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            {/* Aparência */}
            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Aparência</Text>
              <View
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.themeRow}>
                  {THEME_OPTIONS.map((option) => {
                    const active = preference === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setPreference(option.value)}
                        style={[
                          styles.themeChip,
                          {
                            backgroundColor: active ? colors.primaryMuted : colors.surfaceStrong,
                            borderColor: active ? colors.primary : 'transparent',
                          },
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={active ? colors.primary : colors.textMuted}
                        />
                        <Text
                          style={{
                            color: active ? colors.primary : colors.textPrimary,
                            fontWeight: '700',
                            fontSize: 13,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Conta */}
            {!user.isGuest ? (
              <View style={styles.settingsGroup}>
                <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Conta</Text>
                <View
                  style={[
                    styles.groupCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <SettingsRow
                    colors={colors}
                    icon="person-outline"
                    label={editingName ? 'Salvar nome' : 'Editar nome'}
                    value={editingName ? undefined : user.name}
                    onPress={() => {
                      if (editingName) void saveName();
                      else setEditingName(true);
                    }}
                  />
                  {user.role !== 'merchant' ? (
                    <SettingsRow
                      colors={colors}
                      icon="storefront-outline"
                      label="Sou lojista / parceiro"
                      value="Criar perfil de negócio"
                      onPress={() => router.push('/merchant-register')}
                      last
                    />
                  ) : (
                    <SettingsRow
                      colors={colors}
                      icon="calendar-outline"
                      label="Criar evento"
                      value="Enviar para aprovação"
                      onPress={() => router.push('/(tabs)/create')}
                      last
                    />
                  )}
                </View>
              </View>
            ) : null}

            {/* Ações / Logout */}
            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Sessão</Text>
              <View
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {!user.isGuest ? (
                  <SettingsRow
                    colors={colors}
                    icon="log-out-outline"
                    label="Sair da conta"
                    destructive
                    onPress={confirmLogout}
                    last
                  />
                ) : (
                  <SettingsRow
                    colors={colors}
                    icon="log-in-outline"
                    label="Fazer login ou cadastrar"
                    value="Acessar com email ou Google"
                    onPress={() => router.push('/login')}
                    last
                  />
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Novo Check-in */}
      <Modal
        visible={showCheckinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCheckinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-outline" size={22} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Novo Check-in
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCheckinModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalHint, { color: colors.textMuted }]}>
              Registre os lugares que você conheceu para marcar presença no seu passaporte.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Nome do Lugar
            </Text>
            <TextInput
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="Ex.: Cervejaria Turatti, Parque do Cocó..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceStrong,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Cidade
            </Text>
            <TextInput
              value={placeCity}
              onChangeText={setPlaceCity}
              placeholder="Ex.: Fortaleza"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceStrong,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Categoria
            </Text>
            <View style={styles.categoryChips}>
              {['Gastronomia', 'Bar & Pub', 'Praia & Sunset', 'Cultura & Lazer', 'Café'].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setPlaceCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor:
                        placeCategory === cat ? colors.buttonInk : colors.surfaceStrong,
                      borderColor: placeCategory === cat ? colors.buttonInk : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: placeCategory === cat ? colors.buttonInkText : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Notas ou Dica (Opcional)
            </Text>
            <TextInput
              value={placeNotes}
              onChangeText={setPlaceNotes}
              placeholder="O que achou do local?"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceStrong,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  height: 60,
                  textAlignVertical: 'top',
                },
              ]}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowCheckinModal(false)}
                style={[styles.modalSecondaryBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: colors.textMuted }]}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreateCheckin}
                style={[styles.modalPrimaryBtn, { backgroundColor: colors.buttonInk }]}
              >
                <Ionicons name="checkmark" size={16} color={colors.buttonInkText} />
                <Text style={[styles.modalPrimaryBtnText, { color: colors.buttonInkText }]}>
                  Confirmar Check-in
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AmbientBackground>
  );
}

function SettingsRow({
  colors,
  icon,
  label,
  value,
  onPress,
  last = false,
  destructive = false,
  trailing,
}: {
  colors: any;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  destructive?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: destructive
              ? 'rgba(255, 59, 48, 0.12)'
              : colors.surfaceStrong,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? colors.danger : colors.textPrimary}
        />
      </View>
      <View style={styles.rowCopy}>
        <Text
          style={{
            color: destructive ? colors.danger : colors.textPrimary,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
        {value ? (
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {trailing ?? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={destructive ? colors.danger : colors.textMuted}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  heroContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  avatarWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minWidth: 180,
    textAlign: 'center',
  },
  saveNameBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  guestCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  guestContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  guestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  guestBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  guestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  tabLabel: {
    fontSize: 13,
  },
  tabContent: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  citiesScroll: {
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  cityCard: {
    width: 170,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cityCover: {
    width: '100%',
    height: 100,
  },
  cityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cityBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cityInfo: {
    padding: 10,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
  },
  cityState: {
    fontSize: 11,
    marginTop: 2,
  },
  cityCheckinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  cityCheckinsCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  addCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  addCheckinBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  checkinsList: {
    gap: 10,
  },
  checkinCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  checkinCardInner: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  checkinThumb: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
  },
  checkinBody: {
    flex: 1,
    gap: 2,
  },
  checkinTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkinCategory: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  checkinDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  checkinPlaceName: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  checkinNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  checkinRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  checkinRatingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteCheckinBtn: {
    padding: 6,
  },
  emptyCard: {
    padding: 24,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  settingsGroup: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  groupCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.md,
  },
  themeChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalPrimaryBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
