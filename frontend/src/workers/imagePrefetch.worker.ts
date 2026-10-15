// Worker em background para pré-carregamento de imagens em segundo plano
// Evita bloquear a thread principal do React e aquece o cache HTTP do navegador

self.onmessage = async (e: MessageEvent<{ type: string; urls: string[] }>) => {
  if (e.data?.type === 'PREFETCH' && Array.isArray(e.data.urls)) {
    const urls = e.data.urls.filter((url) => typeof url === 'string' && url.trim().length > 0);
    for (const url of urls) {
      try {
        await fetch(url, {
          mode: 'no-cors',
          cache: 'force-cache',
          credentials: 'omit',
        });
      } catch {
        // Ignora silenciosamente erros de rede no prefetch
      }
    }
  }
};

export {};
