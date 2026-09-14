import { router } from 'expo-router';
import { useState } from 'react';

import { AuthError, AuthScreen } from '@/components/auth/AuthScreen';
import { AuthField } from '@/components/auth/AuthField';
import { useGoogleOAuth } from '@/services/googleAuth';
import { useAuthStore } from '@/stores/authStore';
import { useDayTheme } from '@/theme/useDayTheme';

export default function RegisterScreen() {
  const { colors } = useDayTheme();
  const register = useAuthStore((s) => s.register);
  const { signIn: signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleOAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar');
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
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar com Google');
    }
  };

  return (
    <AuthScreen
      colors={colors}
      title="Cadastre-se"
      subtitle="Descubra lugares em Fortaleza com recomendações feitas para você."
      submitLabel="Criar conta"
      loading={loading}
      onSubmit={onSubmit}
      onGoogleSubmit={onGoogleSubmit}
      googleLoading={googleLoading}
      footerText="Já tem uma conta?"
      footerActionLabel="Entrar"
      onFooterAction={() => router.replace('/login')}
    >
      <AuthField
        colors={colors}
        label="Nome"
        value={name}
        onChangeText={setName}
        placeholder="Seu nome"
        autoCapitalize="words"
      />
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
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
      />
      {(error || googleError) && <AuthError message={error || googleError || ''} colors={colors} />}
    </AuthScreen>
  );
}
