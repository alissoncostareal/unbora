import { Redirect } from 'expo-router';

/** Mantido por compatibilidade — formulário agora é a aba Criar. */
export default function CreateEventScreen() {
  return <Redirect href="/(tabs)/create" />;
}
