import { router } from 'expo-router';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { MinimalBackButton } from '@/components/MinimalBackButton';
import { radius, spacing, type ThemeColors } from '@/theme/colors';

interface AuthScreenProps {
  colors: ThemeColors;
  title: string;
  subtitle: string;
  children: ReactNode;
  submitLabel: string;
  loading?: boolean;
  onSubmit: () => void;
  footerText: string;
  footerActionLabel: string;
  onFooterAction: () => void;
  showGuest?: boolean;
  onGoogleSubmit?: () => void;
  googleLoading?: boolean;
}

function getAuthVariant(colors: ThemeColors) {
  const isSpotify = colors.useGlass;
  return {
    isSpotify,
    buttonRadius: isSpotify ? 28 : 12,
    inputRadius: isSpotify ? 6 : 12,
    titleSize: isSpotify ? 32 : 28,
  };
}

export function AuthScreen({
  colors,
  title,
  subtitle,
  children,
  submitLabel,
  loading,
  onSubmit,
  footerText,
  footerActionLabel,
  onFooterAction,
  showGuest = true,
  onGoogleSubmit,
  googleLoading,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const variant = getAuthVariant(colors);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.xl + 48,
            },
          ]}
        >
          <View style={styles.headline}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.textPrimary,
                  fontSize: variant.titleSize,
                  letterSpacing: variant.isSpotify ? -0.8 : -0.5,
                },
              ]}
            >
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>

          <View style={styles.form}>{children}</View>

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.buttonInk,
                borderRadius: radius.md,
                opacity: loading ? 0.75 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.buttonInkText} />
            ) : (
              <Text style={[styles.primaryLabel, { color: colors.buttonInkText }]}>
                {submitLabel}
              </Text>
            )}
          </Pressable>

          {onGoogleSubmit && (
            <Pressable
              onPress={onGoogleSubmit}
              disabled={googleLoading || loading}
              style={[
                styles.googleButton,
                {
                  backgroundColor: variant.isSpotify ? 'transparent' : colors.surface,
                  borderColor: colors.border,
                  borderRadius: variant.buttonRadius,
                  marginTop: spacing.md,
                },
              ]}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <View style={styles.googleContent}>
                  <Ionicons name="logo-google" size={18} color={colors.textPrimary} style={styles.googleIcon} />
                  <Text style={[styles.googleLabel, { color: colors.textPrimary }]}>
                    Entrar com o Google
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            onPress={onFooterAction}
            style={[
              styles.secondaryButton,
              {
                borderColor: colors.border,
                borderRadius: variant.buttonRadius,
                backgroundColor: variant.isSpotify ? 'transparent' : colors.surface,
              },
            ]}
          >
            <Text style={[styles.secondaryLabel, { color: colors.textPrimary }]}>
              {footerActionLabel}
            </Text>
          </Pressable>

          <Text style={[styles.footerHint, { color: colors.textMuted }]}>{footerText}</Text>

          {showGuest && (
            <Pressable onPress={() => router.replace('/')} style={styles.guestLink}>
              <Text style={[styles.guestText, { color: colors.textMuted }]}>
                Pular por enquanto
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <MinimalBackButton colors={colors} onPress={() => router.back()} />
      </KeyboardAvoidingView>
    </View>
  );
}

export function AuthError({ message, colors }: { message: string; colors: ThemeColors }) {
  const isSpotify = colors.useGlass;
  return (
    <View
      style={[
        styles.errorBox,
        {
          backgroundColor: isSpotify ? 'rgba(255, 69, 58, 0.12)' : `${colors.danger}14`,
          borderColor: isSpotify ? 'rgba(255, 69, 58, 0.35)' : `${colors.danger}33`,
        },
      ]}
    >
      <Text style={[styles.errorText, { color: colors.danger }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  headline: {
    marginBottom: spacing.xl,
  },
  title: {
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 340,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  secondaryButton: {
    height: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerHint: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 14,
  },
  guestLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  guestText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 14,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  googleButton: {
    height: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleIcon: {
    marginTop: 1,
  },
  googleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
