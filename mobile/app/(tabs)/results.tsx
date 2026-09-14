import { router } from 'expo-router';
import { useEffect } from 'react';

/** Resultados ficam na aba Explorar. Esta rota só redireciona links antigos. */
export default function ResultsRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/explore');
  }, []);

  return null;
}
