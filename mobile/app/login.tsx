import { router } from 'expo-router';
import { useState } from 'react';

import { AuthError, AuthScreen } from '@/components/auth/AuthScreen';
import { AuthField } from '@/components/auth/AuthField';
import { useGoogleOAuth } from '@/services/googleAuth';
import { useAuthStore } from '@/stores/authStore';
import { useDayTheme } from '@/theme/useDayTheme';

export default function LoginScreen() {
  const { colors } = useDayTheme();
  const login = useAuthStore((s) => s.login);
  const {
    signIn: signInWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleOAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSubmit = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      router.replace('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar com Google');
    }
  };

  return (
    <AuthScreen
      colors={colors}
      title="Entrar no Unbora"
      subtitle="Acesse suas curadorias e preferências salvas em Fortaleza."
      submitLabel="Continuar"
      loading={loading}
      onSubmit={onSubmit}
      onGoogleSubmit={onGoogleSubmit}
      googleLoading={googleLoading}
      footerText="Novo por aqui?"
      footerActionLabel="Criar conta"
      onFooterAction={() => router.replace('/register')}
    >
      <AuthField
        colors={colors}
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthField
        colors={colors}
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="Sua senha"
        secureTextEntry
      />
      {(error || googleError) && <AuthError message={error || googleError || ''} colors={colors} />}
    </AuthScreen>
  );
}
