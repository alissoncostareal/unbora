import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return rewriteLocalhostForDevice(envUrl);

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
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Tempo esgotado ao conectar em ${baseUrl}. Verifique se o backend Nest está rodando.`,
      );
    }

    if (__DEV__) {
      console.warn('[Unbora] fetch falhou:', url, error);
    }

    throw new Error(
      `Não foi possível conectar em ${baseUrl}. Inicie o backend: cd backend && npm run start:dev`,
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

  if (__DEV__) {
    console.log('[Unbora] POST', url);
  }

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
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Erro na requisição'));
  }
  return data as T;
}

export async function apiGet<T>(path: string, timeoutMs = 15_000): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;

  if (__DEV__) {
    console.log('[Unbora] GET', url);
  }

  const response = await fetchWithTimeout(url, {}, timeoutMs);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Erro na requisição'));
  }
  return data as T;
}
