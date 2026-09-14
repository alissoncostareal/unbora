type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel = __DEV__ ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

function formatPayload(payload?: unknown): unknown[] {
  if (payload === undefined) return [];
  if (payload instanceof Error) {
    return [payload.message, payload];
  }
  return [payload];
}

function emit(level: LogLevel, scope: string, message: string, payload?: unknown) {
  if (!shouldLog(level)) return;
  const prefix = `[Unbora:${scope}]`;
  const args = [prefix, message, ...formatPayload(payload)];
  switch (level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.log(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

export const log = {
  debug: (scope: string, message: string, payload?: unknown) =>
    emit('debug', scope, message, payload),
  info: (scope: string, message: string, payload?: unknown) =>
    emit('info', scope, message, payload),
  warn: (scope: string, message: string, payload?: unknown) =>
    emit('warn', scope, message, payload),
  error: (scope: string, message: string, payload?: unknown) =>
    emit('error', scope, message, payload),
};

export function shortUrl(url?: string | null, max = 96): string {
  if (!url) return '(vazio)';
  if (url.startsWith('data:')) return `data:(${url.length} chars)`;
  return url.length <= max ? url : `${url.slice(0, max)}…`;
}
