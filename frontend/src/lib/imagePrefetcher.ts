/**
 * Utilitário de aquecimento de cache e pré-carregamento imediato de imagens.
 * Garante que todas as imagens da página ativa sejam baixadas assim que a página abre,
 * e pré-carrega as imagens da próxima página (ex: página 2) em segundo plano via Web Worker.
 */

const preloadedUrls = new Set<string>();

let workerInstance: Worker | null = null;
let workerInitialized = false;

function getWorker(): Worker | null {
  if (workerInitialized) return workerInstance;
  workerInitialized = true;

  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  try {
    workerInstance = new Worker(new URL('../workers/imagePrefetch.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch {
    workerInstance = null;
  }
  return workerInstance;
}

/**
 * Pré-carrega uma imagem individual na thread principal para decodificação imediata.
 */
export function preloadImage(url: string, priority: 'high' | 'low' = 'high'): Promise<void> {
  if (!url || typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (preloadedUrls.has(url)) {
    return Promise.resolve();
  }
  preloadedUrls.add(url);

  return new Promise((resolve) => {
    const img = new Image();
    if ('fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
    }
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Pré-carrega um lote de imagens com prioridade.
 */
export function preloadBatch(urls: string[], priority: 'high' | 'low' = 'high'): void {
  const valid = urls.filter((u) => typeof u === 'string' && u.trim().length > 0 && !preloadedUrls.has(u));
  if (valid.length === 0) return;

  // Carrega até 6 em paralelo para otimizar conexões HTTP/2 do navegador
  const batchSize = 6;
  let index = 0;

  function runNext() {
    if (index >= valid.length) return;
    const chunk = valid.slice(index, index + batchSize);
    index += batchSize;

    Promise.all(chunk.map((url) => preloadImage(url, priority))).then(() => {
      if (index < valid.length) {
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(runNext);
        } else {
          setTimeout(runNext, 40);
        }
      }
    });
  }

  runNext();
}

/**
 * Pré-carrega imediatamente todas as imagens da página visível
 * e agenda o pré-carregamento da próxima página em background worker.
 */
export function preloadPageImages(
  currentPageUrls: string[],
  nextPageUrls: string[] = []
): void {
  if (typeof window === 'undefined') return;

  // 1. Carregamento imediato de alta prioridade de todas as fotos da página atual
  if (currentPageUrls && currentPageUrls.length > 0) {
    preloadBatch(currentPageUrls, 'high');
  }

  // 2. Pré-carregamento em background da próxima página
  if (nextPageUrls && nextPageUrls.length > 0) {
    const worker = getWorker();
    if (worker) {
      worker.postMessage({
        type: 'PREFETCH',
        urls: nextPageUrls,
      });
    }

    const idleFallback = () => {
      preloadBatch(nextPageUrls, 'low');
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opt?: { timeout: number }) => void }).requestIdleCallback(
        idleFallback,
        { timeout: 1500 }
      );
    } else {
      setTimeout(idleFallback, 300);
    }
  }
}
