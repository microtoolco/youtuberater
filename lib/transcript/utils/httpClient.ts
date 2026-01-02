// HTTP client with timeouts, retries, and error handling

import { Logger } from './logger';

export interface HttpOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = string> {
  ok: boolean;
  status: number;
  data: T;
  headers: Headers;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function httpGet(
  url: string,
  options: HttpOptions = {},
  logger?: Logger
): Promise<HttpResponse> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    headers = {},
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      logger?.debug('HTTP GET request', { url: url.slice(0, 100), attempt });

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.text();

      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}`,
          response.status,
          `HTTP_${response.status}`
        );
      }

      return {
        ok: true,
        status: response.status,
        data,
        headers: response.headers,
      };
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        logger?.warn('Request timeout', { url: url.slice(0, 100), attempt });
        lastError = new HttpError('Request timeout', 408, 'TIMEOUT');
      }

      // Don't retry on 4xx errors (except 429)
      if (error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        logger?.debug('Retrying request', { attempt, delay });
        await sleep(delay);
      }
    }
  }

  throw lastError || new HttpError('Request failed', 0, 'UNKNOWN');
}

export async function httpPost<T = unknown>(
  url: string,
  body: unknown,
  options: HttpOptions = {},
  logger?: Logger
): Promise<HttpResponse<T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    headers = {},
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      logger?.debug('HTTP POST request', { url: url.slice(0, 100), attempt });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let data: T;

      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as unknown as T;
      }

      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}`,
          response.status,
          `HTTP_${response.status}`
        );
      }

      return {
        ok: true,
        status: response.status,
        data,
        headers: response.headers,
      };
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        logger?.warn('Request timeout', { url: url.slice(0, 100), attempt });
        lastError = new HttpError('Request timeout', 408, 'TIMEOUT');
      }

      // Don't retry on 4xx errors (except 429)
      if (error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        logger?.debug('Retrying request', { attempt, delay });
        await sleep(delay);
      }
    }
  }

  throw lastError || new HttpError('Request failed', 0, 'UNKNOWN');
}
