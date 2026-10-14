import { Redirect } from 'expo-router';

/** Aba Criar redirecionada para Home enquanto eventos estão desativados. */
export default function CreateTabScreen() {
  return <Redirect href="/(tabs)/home" />;
}
