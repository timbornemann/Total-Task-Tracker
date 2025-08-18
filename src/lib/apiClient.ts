/**
 * Central API client with unified error handling, retry logic, and request management
 */

// Error types for different categories of failures
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: Response,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.cause = originalError;
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Request configuration interface
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
  skipRetryOn?: number[]; // HTTP status codes to not retry on
}

// Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<Pick<ApiRequestConfig, 'timeout' | 'retries' | 'retryDelay'>> & {
  retry: RetryConfig;
} = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000,
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBase: 2,
    jitter: true,
  },
};

// HTTP status codes that are considered idempotent-safe for retries
const IDEMPOTENT_METHODS = ['GET', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Logger interface for error reporting
 */
interface Logger {
  error: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
}

// Simple console logger (can be replaced with more sophisticated logging)
const logger: Logger = {
  error: (message: string, data?: any) => {
    console.error(`[ApiClient] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[ApiClient] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.info(`[ApiClient] ${message}`, data);
  },
};

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.exponentialBase, attempt - 1),
    config.maxDelay
  );
  
  // Add jitter to prevent thundering herd
  if (config.jitter) {
    return delay + Math.random() * 1000;
  }
  
  return delay;
}

/**
 * Check if a request should be retried based on method and status code
 */
function shouldRetry(
  method: string,
  statusCode: number,
  attempt: number,
  maxRetries: number,
  skipRetryOn: number[] = []
): boolean {
  if (attempt >= maxRetries) return false;
  if (skipRetryOn.includes(statusCode)) return false;
  
  // Only retry idempotent methods or specific error codes
  return (
    IDEMPOTENT_METHODS.includes(method.toUpperCase()) || 
    RETRY_STATUS_CODES.includes(statusCode)
  );
}

/**
 * Create timeout promise
 */
function createTimeoutPromise(timeout: number, signal?: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(`Request timed out after ${timeout}ms`));
    }, timeout);

    // Clear timeout if request is aborted
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new ApiError('Request aborted'));
    });
  });
}

/**
 * Process response and handle different content types
 */
async function processResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type') || '';
  
  let data: T;
  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = (await response.text()) as unknown as T;
    } else {
      data = (await response.blob()) as unknown as T;
    }
  } catch (parseError) {
    logger.error('Failed to parse response', { 
      status: response.status,
      contentType,
      error: parseError 
    });
    throw new ApiError('Failed to parse response', response.status, response);
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

/**
 * Main API client class
 */
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultConfig: typeof DEFAULT_CONFIG;

  constructor(
    baseURL: string = '',
    defaultHeaders: Record<string, string> = {},
    config: Partial<typeof DEFAULT_CONFIG> = {}
  ) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    this.defaultConfig = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  async request<T = any>(
    url: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultConfig.timeout,
      retries = this.defaultConfig.retries,
      abortSignal,
      skipRetryOn = [],
    } = config;

    const fullUrl = this.baseURL + url;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        // Create AbortController for this attempt if none provided
        const controller = new AbortController();
        const signal = abortSignal || controller.signal;

        // Setup request options
        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
          signal,
        };

        // Add body for non-GET requests
        if (body && method !== 'GET' && method !== 'HEAD') {
          requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        logger.info(`Making ${method} request to ${fullUrl}`, { 
          attempt, 
          retries: retries + 1 
        });

        // Race between fetch and timeout
        const response = await Promise.race([
          fetch(fullUrl, requestOptions),
          createTimeoutPromise(timeout, signal),
        ]);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await processResponse(response).catch(() => null);
          
          // Check if we should retry
          if (
            attempt <= retries &&
            shouldRetry(method, response.status, attempt, retries + 1, skipRetryOn)
          ) {
            const delay = calculateRetryDelay(attempt, this.defaultConfig.retry);
            logger.warn(`Request failed, retrying in ${delay}ms`, {
              url: fullUrl,
              status: response.status,
              attempt,
              delay,
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          // Create appropriate error based on status code
          let error: ApiError;
          if (response.status >= 400 && response.status < 500) {
            if (response.status === 422) {
              error = new ValidationError(
                'Validation failed',
                errorData?.data?.errors
              );
            } else {
              error = new ApiError(
                `Client error: ${response.statusText}`,
                response.status,
                response,
                errorData?.data
              );
            }
          } else {
            error = new ApiError(
              `Server error: ${response.statusText}`,
              response.status,
              response,
              errorData?.data
            );
          }

          logger.error('Request failed with HTTP error', {
            url: fullUrl,
            status: response.status,
            statusText: response.statusText,
            error: error.message,
          });

          throw error;
        }

        // Success - process and return response
        const result = await processResponse<T>(response);
        
        if (attempt > 1) {
          logger.info(`Request succeeded after ${attempt} attempts`, { url: fullUrl });
        }
        
        return result;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (
          error instanceof TimeoutError ||
          error instanceof ValidationError ||
          (error as any)?.name === 'AbortError'
        ) {
          logger.error('Non-retryable error occurred', { 
            url: fullUrl, 
            error: error.message 
          });
          throw error;
        }

        // Network/fetch errors
        if (error instanceof TypeError || error.message.includes('Failed to fetch')) {
          const networkError = new NetworkError(
            'Network request failed - check your internet connection',
            error as Error
          );

          // Retry network errors for idempotent methods
          if (
            attempt <= retries &&
            shouldRetry(method, 0, attempt, retries + 1, skipRetryOn)
          ) {
            const delay = calculateRetryDelay(attempt, this.defaultConfig.retry);
            logger.warn(`Network error, retrying in ${delay}ms`, {
              url: fullUrl,
              attempt,
              delay,
              error: error.message,
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          logger.error('Network error - max retries exceeded', { 
            url: fullUrl, 
            error: error.message 
          });
          throw networkError;
        }

        // Re-throw other errors immediately
        logger.error('Unexpected error during request', { 
          url: fullUrl, 
          error: error.message 
        });
        throw error;
      }
    }

    // This should never be reached, but just in case
    throw lastError || new ApiError('Request failed after all retries');
  }

  // Convenience methods
  async get<T>(url: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method'>) {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  async put<T>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method'>) {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  async delete<T>(url: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  async patch<T>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method'>) {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// Export convenience functions that use the default client
export const api = {
  get: <T>(url: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    apiClient.get<T>(url, config),
  
  post: <T>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method'>) =>
    apiClient.post<T>(url, body, config),
  
  put: <T>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method'>) =>
    apiClient.put<T>(url, body, config),
  
  delete: <T>(url: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    apiClient.delete<T>(url, config),
  
  patch: <T>(url: string, body?: any, config?: Omit<ApiRequestConfig, 'method'>) =>
    apiClient.patch<T>(url, body, config),
};
