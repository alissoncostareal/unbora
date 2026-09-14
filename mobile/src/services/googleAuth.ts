import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

import { useAuthStore } from '@/stores/authStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_WEB =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '';
const GOOGLE_CLIENT_ID_IOS =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '';
const GOOGLE_CLIENT_ID_ANDROID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '';

/** IDs reais para a plataforma atual — sem isso o hook do Expo crasha no render. */
function platformClientIdConfigured(): boolean {
  if (Platform.OS === 'ios') return Boolean(GOOGLE_CLIENT_ID_IOS);
  if (Platform.OS === 'android') return Boolean(GOOGLE_CLIENT_ID_ANDROID);
  return Boolean(GOOGLE_CLIENT_ID_WEB);
}

/**
 * Placeholders só para satisfazer o invariant do expo-auth-session quando
 * a chave da plataforma ainda não existe (dev local). Nunca usados em promptAsync.
 */
const PLACEHOLDER_CLIENT_ID = 'unbora-dev-placeholder.apps.googleusercontent.com';

export function useGoogleOAuth() {
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = platformClientIdConfigured();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID_WEB || PLACEHOLDER_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID_IOS || PLACEHOLDER_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID || PLACEHOLDER_CLIENT_ID,
    redirectUri: makeRedirectUri({
      scheme: 'unbora',
      path: 'oauthredirect',
    }),
  });

  useEffect(() => {
    if (!response || !isConfigured) return;

    if (response.type === 'success') {
      const { authentication, params } = response;
      const idToken = authentication?.idToken || params?.id_token;

      if (idToken) {
        setLoading(true);
        googleLogin({ idToken })
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Falha na autenticação com Google');
          })
          .finally(() => {
            setLoading(false);
          });
      } else if (authentication?.accessToken) {
        setLoading(true);
        fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        })
          .then((res) => res.json())
          .then((info) =>
            googleLogin({
              email: info.email,
              name: info.name || 'Usuário Google',
              googleId: info.id || `google-${Date.now()}`,
            }),
          )
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Falha ao obter perfil do Google');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else if (response.type === 'error') {
      setError(response.error?.message || 'Erro ao autenticar com o Google');
      setLoading(false);
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      setLoading(false);
    }
  }, [response, googleLogin, isConfigured]);

  const signIn = async () => {
    setError(null);
    setLoading(true);

    try {
      if (isConfigured && request) {
        const result = await promptAsync();
        if (result.type !== 'success') {
          setLoading(false);
        }
        return;
      }

      if (__DEV__) {
        console.warn(
          '[Unbora OAuth] Client ID do Google ausente para esta plataforma. ' +
            'Defina EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS) no mobile/.env. Usando login demo.',
        );
        await googleLogin({
          email: 'usuario.demo@unbora.com',
          name: 'Alisson Costa (Google OAuth)',
          googleId: 'google-oauth-demo-user',
        });
        setLoading(false);
        return;
      }

      setLoading(false);
      const msg =
        Platform.OS === 'ios'
          ? 'Configure EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID no .env do mobile.'
          : 'Login com Google não configurado neste ambiente.';
      setError(msg);
      throw new Error(msg);
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : 'Erro ao iniciar login com Google';
      setError(msg);
      throw e;
    }
  };

  return {
    signIn,
    loading,
    error,
    isConfigured,
  };
}
