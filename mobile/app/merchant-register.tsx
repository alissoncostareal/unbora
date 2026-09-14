import { router } from 'expo-router';
import { useState } from 'react';

import { AuthError, AuthScreen } from '@/components/auth/AuthScreen';
import { AuthField } from '@/components/auth/AuthField';
import { useAuthStore } from '@/stores/authStore';
import { useDayTheme } from '@/theme/useDayTheme';

export default function MerchantRegisterScreen() {
  const { colors } = useDayTheme();
  const registerMerchant = useAuthStore((s) => s.registerMerchant);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await registerMerchant(
        name.trim(),
        email.trim(),
        password,
        businessName.trim(),
      );
      router.replace('/(tabs)/events');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar lojista');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      colors={colors}
      title="Conta de lojista"
      subtitle="Cadastre seu negócio e publique eventos para a comunidade Unbora."
      submitLabel="Criar conta de lojista"
      loading={loading}
      onSubmit={onSubmit}
      footerText="Já tem conta?"
      footerActionLabel="Entrar"
      onFooterAction={() => router.replace('/login')}
      showGuest={false}
    >
      <AuthField
        colors={colors}
        label="Seu nome"
        value={name}
        onChangeText={setName}
        placeholder="Nome do responsável"
        autoCapitalize="words"
      />
      <AuthField
        colors={colors}
        label="Nome do negócio"
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="Ex.: Bar do Sol"
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
      {error && <AuthError message={error} colors={colors} />}
    </AuthScreen>
  );
}
