/**
 * Utilities for navigating to error pages and handling different error scenarios
 */

import { NavigateFunction } from 'react-router-dom';

export interface ErrorNavigationOptions {
  /** Replace current history entry instead of pushing new one */
  replace?: boolean;
  /** Additional context to pass to error page */
  context?: {
    message?: string;
    details?: string;
    referrer?: string;
  };
}

/**
 * Navigate to 404 Not Found page
 */
export function navigateTo404(
  navigate: NavigateFunction,
  options: ErrorNavigationOptions = {}
) {
  const { replace = false, context } = options;
  
  const searchParams = new URLSearchParams();
  
  if (context?.message) {
    searchParams.set('message', context.message);
  }
  if (context?.details) {
    searchParams.set('details', context.details);
  }
  if (context?.referrer) {
    searchParams.set('from', context.referrer);
  }

  const path = window.location.pathname;
  if (path !== '/') {
    searchParams.set('path', path);
  }

  const url = `/?${searchParams.toString()}#not-found`;
  
  if (replace) {
    navigate(url, { replace: true });
  } else {
    navigate(url);
  }
}

/**
 * Navigate to server error page
 */
export function navigateToServerError(
  navigate: NavigateFunction,
  statusCode: number = 500,
  options: ErrorNavigationOptions = {}
) {
  const { replace = false, context } = options;
  
  const searchParams = new URLSearchParams();
  searchParams.set('status', statusCode.toString());
  
  if (context?.message) {
    searchParams.set('message', context.message);
  }
  if (context?.details) {
    searchParams.set('details', context.details);
  }
  if (context?.referrer) {
    searchParams.set('from', context.referrer);
  }

  const url = `/error?${searchParams.toString()}`;
  
  if (replace) {
    navigate(url, { replace: true });
  } else {
    navigate(url);
  }
}

/**
 * Handle API errors and navigate to appropriate error page
 */
export function handleApiErrorNavigation(
  error: unknown,
  navigate: NavigateFunction,
  options: ErrorNavigationOptions = {}
) {
  // Extract status code from different error formats
  let statusCode = 500;
  let message = 'Ein unerwarteter Fehler ist aufgetreten';
  let details = '';

  if (error?.response?.status) {
    // Axios-style error
    statusCode = error.response.status;
    message = error.response.data?.message || error.message;
    details = error.response.data?.details || '';
  } else if (error?.status) {
    // Fetch Response object
    statusCode = error.status;
    message = error.statusText || error.message;
  } else if (error?.statusCode) {
    // Custom ApiError
    statusCode = error.statusCode;
    message = error.message;
    details = error.details || '';
  } else if (error?.message) {
    // Generic error object
    message = error.message;
    details = error.stack || '';
  }

  // Navigate based on status code
  if (statusCode === 404) {
    navigateTo404(navigate, {
      ...options,
      context: {
        message,
        details,
        ...options.context,
      },
    });
  } else if (statusCode >= 500) {
    navigateToServerError(navigate, statusCode, {
      ...options,
      context: {
        message,
        details,
        ...options.context,
      },
    });
  } else {
    // For other client errors, show a generic error
    navigateToServerError(navigate, statusCode, {
      ...options,
      context: {
        message,
        details,
        ...options.context,
      },
    });
  }
}

/**
 * Global error handler that can be used as unhandled promise rejection handler
 */
export function createGlobalErrorHandler(navigate: NavigateFunction) {
  return (error: unknown) => {
    console.error('[Global Error Handler]', error);
    
    // Don't handle certain error types that should be handled elsewhere
    if (
      error?.name === 'ChunkLoadError' ||
      error?.name === 'ResizeObserver loop limit exceeded' ||
      error?.message?.includes('Non-Error promise rejection')
    ) {
      return;
    }

    // Navigate to appropriate error page
    handleApiErrorNavigation(error, navigate, {
      replace: true,
      context: {
        referrer: window.location.pathname,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
    });
  };
}

/**
 * Hook-friendly error navigation utilities
 */
export function createErrorNavigationUtils(navigate: NavigateFunction) {
  return {
    navigateTo404: (options?: ErrorNavigationOptions) => 
      navigateTo404(navigate, options),
    
    navigateToServerError: (statusCode?: number, options?: ErrorNavigationOptions) => 
      navigateToServerError(navigate, statusCode, options),
    
    handleApiError: (error: unknown, options?: ErrorNavigationOptions) =>
      handleApiErrorNavigation(error, navigate, options),
    
    createGlobalHandler: () => createGlobalErrorHandler(navigate),
  };
}

/**
 * Check if current URL is an error page
 */
export function isErrorPage(pathname: string): boolean {
  return pathname === '/error' || pathname.includes('not-found');
}

/**
 * Extract error information from current URL
 */
export function getErrorInfoFromUrl(): {
  isNotFound: boolean;
  isServerError: boolean;
  statusCode?: number;
  message?: string;
  details?: string;
  referrer?: string;
} {
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  const hash = url.hash;

  const isNotFound = hash === '#not-found' || pathname === '/404';
  const isServerError = pathname === '/error';

  let statusCode: number | undefined;
  if (isNotFound) {
    statusCode = 404;
  } else if (isServerError) {
    statusCode = parseInt(searchParams.get('status') || '500');
  }

  return {
    isNotFound,
    isServerError,
    statusCode,
    message: searchParams.get('message') || undefined,
    details: searchParams.get('details') || undefined,
    referrer: searchParams.get('from') || undefined,
  };
}
