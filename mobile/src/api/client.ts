import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { log, shortUrl } from '@/utils/log';

function resolveDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;

  if (!hostUri) return null;

  return hostUri.split(':')[0] ?? null;
}

function isPhysicalDevice(): boolean {
  return Device.isDevice === true;
}

function rewriteLocalhostForDevice(url: string): string {
  if (!__DEV__ || !isPhysicalDevice()) return url;

  const devHost = resolveDevHost();
  if (!devHost || devHost === '127.0.0.1' || devHost === 'localhost') {
    return url;
  }

  return url
    .replace('127.0.0.1', devHost)
    .replace('localhost', devHost);
}

function getDefaultApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) {
    // 10.0.2.2 só funciona no emulador Android; no aparelho físico usa o host do Metro.
    if (__DEV__ && isPhysicalDevice() && /10\.0\.2\.2/.test(envUrl)) {
      const devHost = resolveDevHost();
      if (devHost) return `http://${devHost}:3001`;
    }
    return rewriteLocalhostForDevice(envUrl);
  }

  if (__DEV__) {
    if (!isPhysicalDevice()) {
      if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3001';
      }
      return 'http://127.0.0.1:3001';
    }

    const devHost = resolveDevHost();
    if (devHost) {
      return `http://${devHost}:3001`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://127.0.0.1:3001';
}

export function getApiBaseUrl(): string {
  return getDefaultApiUrl();
}

export const API_BASE_URL = getDefaultApiUrl();

export function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (Array.isArray(record.message) && typeof record.message[0] === 'string') {
    return record.message[0];
  }
  if (typeof record.error === 'string') return record.error;
  return fallback;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const baseUrl = getApiBaseUrl();
    const message = error instanceof Error ? error.message : '';
    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      /aborted|canceled|cancelled/i.test(message);

    if (aborted) {
      throw new Error(
        'A busca demorou demais e foi interrompida. Tente de novo — o backend continua no ar.',
      );
    }

    if (__DEV__) {
      log.warn('api', `fetch falhou: ${shortUrl(url)}`, error);
    }

    throw new Error(
      `Não foi possível conectar em ${baseUrl}. Confira se a API está em execução na porta 3001.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  timeoutMs = 30_000,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const started = Date.now();
  log.info('api', `POST ${path}`);

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

  const data = await response.json().catch(() => ({}));
  const ms = Date.now() - started;
  if (!response.ok) {
    log.error('api', `POST ${path} -> ${response.status} (${ms}ms)`, data);
    throw new Error(getApiErrorMessage(data, 'Erro na requisição'));
  }
  log.debug('api', `POST ${path} ok (${ms}ms)`);
  return data as T;
}

export async function apiGet<T>(path: string, timeoutMs = 15_000): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const started = Date.now();
  log.info('api', `GET ${path}`);

  const response = await fetchWithTimeout(url, {}, timeoutMs);
  const data = await response.json().catch(() => ({}));
  const ms = Date.now() - started;
  if (!response.ok) {
    log.error('api', `GET ${path} -> ${response.status} (${ms}ms)`, data);
    throw new Error(getApiErrorMessage(data, 'Erro na requisição'));
  }
  log.debug('api', `GET ${path} ok (${ms}ms)`);
  return data as T;
}
