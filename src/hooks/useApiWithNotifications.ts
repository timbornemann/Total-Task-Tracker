/**
 * Hook that integrates API client with error notifications
 * Provides convenient methods for API calls with automatic error handling
 */

import { useCallback, useRef } from 'react';
import { api, ApiRequestConfig, ApiResponse } from '@/lib/apiClient';
import { 
  showErrorNotification, 
  showSuccessNotification,
  ErrorContext, 
  ErrorNotificationConfig,
  withErrorHandling
} from '@/lib/errorNotifications';

export interface UseApiOptions {
  /** Default error context for all API calls */
  defaultContext?: ErrorContext;
  /** Default notification configuration */
  defaultConfig?: ErrorNotificationConfig;
  /** Whether to show success notifications by default */
  showSuccessNotifications?: boolean;
}

export function useApiWithNotifications(options: UseApiOptions = {}) {
  const {
    defaultContext = {},
    defaultConfig = {},
    showSuccessNotifications = true,
  } = options;

  // Track ongoing requests to prevent duplicate calls
  const ongoingRequests = useRef(new Set<string>());

  /**
   * Create a request key for deduplication
   */
  const createRequestKey = useCallback((method: string, url: string, body?: any) => {
    const bodyKey = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyKey}`;
  }, []);

  /**
   * Generic API call with error handling and notifications
   */
  const makeApiCall = useCallback(async <T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    body?: any,
    context: ErrorContext = {},
    config: ErrorNotificationConfig = {},
    requestConfig: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<T | null> => {
    const mergedContext = { ...defaultContext, ...context };
    const mergedConfig = { ...defaultConfig, ...config };
    
    // Create request key for deduplication
    const requestKey = createRequestKey(method, url, body);
    
    // Check if request is already ongoing
    if (ongoingRequests.current.has(requestKey)) {
      console.warn(`[useApiWithNotifications] Duplicate request prevented: ${requestKey}`);
      return null;
    }

    // Add to ongoing requests
    ongoingRequests.current.add(requestKey);

    try {
      let result: ApiResponse<T>;
      
      switch (method) {
        case 'get':
          result = await api.get<T>(url, requestConfig);
          break;
        case 'post':
          result = await api.post<T>(url, body, { ...requestConfig });
          break;
        case 'put':
          result = await api.put<T>(url, body, { ...requestConfig });
          break;
        case 'delete':
          result = await api.delete<T>(url, requestConfig);
          break;
        case 'patch':
          result = await api.patch<T>(url, body, { ...requestConfig });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Show success notification if enabled and not a fetch operation
      if (
        showSuccessNotifications &&
        mergedContext.operation !== 'fetch' &&
        mergedContext.resource &&
        mergedContext.operation
      ) {
        showSuccessNotification('', mergedContext);
      }

      return result.data;
    } catch (error) {
      // Handle retry logic
      const retryableContext = {
        ...mergedContext,
        onRetry: mergedContext.onRetry || (() => 
          makeApiCall(method, url, body, context, config, requestConfig)
        ),
      };

      showErrorNotification(error as Error, retryableContext, mergedConfig);
      return null;
    } finally {
      // Remove from ongoing requests
      ongoingRequests.current.delete(requestKey);
    }
  }, [defaultContext, defaultConfig, showSuccessNotifications, createRequestKey]);

  /**
   * GET request with error handling
   */
  const get = useCallback(<T>(
    url: string,
    context?: ErrorContext,
    config?: ErrorNotificationConfig,
    requestConfig?: Omit<ApiRequestConfig, 'method' | 'body'>
  ) => makeApiCall<T>('get', url, undefined, context, config, requestConfig), [makeApiCall]);

  /**
   * POST request with error handling
   */
  const post = useCallback(<T>(
    url: string,
    body?: any,
    context?: ErrorContext,
    config?: ErrorNotificationConfig,
    requestConfig?: Omit<ApiRequestConfig, 'method'>
  ) => makeApiCall<T>('post', url, body, context, config, requestConfig), [makeApiCall]);

  /**
   * PUT request with error handling
   */
  const put = useCallback(<T>(
    url: string,
    body?: any,
    context?: ErrorContext,
    config?: ErrorNotificationConfig,
    requestConfig?: Omit<ApiRequestConfig, 'method'>
  ) => makeApiCall<T>('put', url, body, context, config, requestConfig), [makeApiCall]);

  /**
   * DELETE request with error handling
   */
  const del = useCallback(<T>(
    url: string,
    context?: ErrorContext,
    config?: ErrorNotificationConfig,
    requestConfig?: Omit<ApiRequestConfig, 'method' | 'body'>
  ) => makeApiCall<T>('delete', url, undefined, context, config, requestConfig), [makeApiCall]);

  /**
   * PATCH request with error handling
   */
  const patch = useCallback(<T>(
    url: string,
    body?: any,
    context?: ErrorContext,
    config?: ErrorNotificationConfig,
    requestConfig?: Omit<ApiRequestConfig, 'method'>
  ) => makeApiCall<T>('patch', url, body, context, config, requestConfig), [makeApiCall]);

  /**
   * Wrapper for any function that might throw errors
   */
  const withNotifications = useCallback(<T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    config?: ErrorNotificationConfig
  ) => withErrorHandling(operation, { ...defaultContext, ...context }, { ...defaultConfig, ...config }), 
  [defaultContext, defaultConfig]);

  /**
   * Create a pre-configured API client for a specific resource
   */
  const createResourceApi = useCallback(<T = any>(resourceName: string) => ({
    create: (data: T, context?: Partial<ErrorContext>) => post<T>(
      `/api/${resourceName}`,
      data,
      { resource: resourceName, operation: 'create', ...context }
    ),
    
    update: (id: string, data: Partial<T>, context?: Partial<ErrorContext>) => put<T>(
      `/api/${resourceName}/${id}`,
      data,
      { resource: resourceName, operation: 'update', ...context }
    ),
    
    delete: (id: string, context?: Partial<ErrorContext>) => del(
      `/api/${resourceName}/${id}`,
      { resource: resourceName, operation: 'delete', ...context }
    ),
    
    get: (id: string, context?: Partial<ErrorContext>) => get<T>(
      `/api/${resourceName}/${id}`,
      { resource: resourceName, operation: 'fetch', ...context }
    ),
    
    list: (context?: Partial<ErrorContext>) => get<T[]>(
      `/api/${resourceName}`,
      { resource: resourceName, operation: 'fetch', ...context }
    ),
    
    sync: (data: T[], context?: Partial<ErrorContext>) => put<T[]>(
      `/api/${resourceName}`,
      data,
      { resource: resourceName, operation: 'sync', ...context }
    ),
  }), [get, post, put, del]);

  /**
   * Clear all ongoing requests (useful for cleanup)
   */
  const clearOngoingRequests = useCallback(() => {
    ongoingRequests.current.clear();
  }, []);

  return {
    // Basic HTTP methods
    get,
    post,
    put,
    delete: del,
    patch,
    
    // Utility functions
    withNotifications,
    createResourceApi,
    clearOngoingRequests,
    
    // Access to ongoing requests for debugging
    getOngoingRequests: () => Array.from(ongoingRequests.current),
  };
}

/**
 * Specialized hook for data synchronization
 */
export function useSyncApi() {
  const api = useApiWithNotifications({
    defaultContext: { operation: 'sync' },
    showSuccessNotifications: false, // Handle sync notifications separately
  });

  const syncData = useCallback(async <T>(
    endpoint: string,
    localData: T,
    context?: Partial<ErrorContext>
  ) => {
    return api.put<T>(endpoint, localData, {
      action: 'Synchronisierung',
      ...context,
    });
  }, [api]);

  const fetchData = useCallback(async <T>(
    endpoint: string,
    context?: Partial<ErrorContext>
  ) => {
    return api.get<T>(endpoint, {
      action: 'Daten laden',
      ...context,
    }, {
      show: false, // Don't show errors for background fetches
    });
  }, [api]);

  return {
    syncData,
    fetchData,
    ...api,
  };
}
