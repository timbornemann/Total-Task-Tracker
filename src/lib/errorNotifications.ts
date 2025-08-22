/**
 * Central error notification system with user-friendly messages
 * Integrates with existing toast systems to show meaningful error messages
 */

import { toast } from "sonner";
import {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from "./apiClient";

// Error message translations for different locales
interface ErrorMessages {
  network: {
    title: string;
    description: string;
    retry: string;
  };
  timeout: {
    title: string;
    description: string;
    retry: string;
  };
  validation: {
    title: string;
    description: string;
  };
  server: {
    title: string;
    description: string;
    retry: string;
  };
  client: {
    title: string;
    description: string;
  };
  storage: {
    title: string;
    description: string;
    retry: string;
  };
  sync: {
    title: string;
    description: string;
    retry: string;
  };
  offline: {
    title: string;
    description: string;
  };
  generic: {
    title: string;
    description: string;
  };
}

const errorMessages: ErrorMessages = {
  network: {
    title: "Verbindungsfehler",
    description:
      "Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
    retry: "Erneut versuchen",
  },
  timeout: {
    title: "Zeitüberschreitung",
    description: "Die Anfrage dauerte zu lange. Versuchen Sie es erneut.",
    retry: "Erneut versuchen",
  },
  validation: {
    title: "Eingabefehler",
    description:
      "Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.",
  },
  server: {
    title: "Server-Fehler",
    description:
      "Ein Fehler ist auf dem Server aufgetreten. Versuchen Sie es später erneut.",
    retry: "Erneut versuchen",
  },
  client: {
    title: "Anfragefehler",
    description: "Die Anfrage konnte nicht verarbeitet werden.",
  },
  storage: {
    title: "Speicherfehler",
    description: "Die Daten konnten nicht gespeichert werden.",
    retry: "Erneut versuchen",
  },
  sync: {
    title: "Synchronisierungsfehler",
    description: "Die Daten konnten nicht synchronisiert werden.",
    retry: "Synchronisieren",
  },
  offline: {
    title: "Offline-Modus",
    description:
      "Sie sind offline. Änderungen werden synchronisiert, sobald Sie wieder online sind.",
  },
  generic: {
    title: "Unbekannter Fehler",
    description: "Ein unerwarteter Fehler ist aufgetreten.",
  },
};

// User-friendly HTTP status code messages
const httpStatusMessages: Record<
  number,
  { title: string; description: string }
> = {
  400: {
    title: "Ungültige Anfrage",
    description: "Die gesendeten Daten sind ungültig.",
  },
  401: {
    title: "Nicht autorisiert",
    description: "Sie sind nicht berechtigt, diese Aktion auszuführen.",
  },
  403: {
    title: "Zugriff verweigert",
    description: "Sie haben keine Berechtigung für diese Ressource.",
  },
  404: {
    title: "Nicht gefunden",
    description: "Die angeforderte Ressource wurde nicht gefunden.",
  },
  409: {
    title: "Konflikt",
    description: "Es liegt ein Konflikt mit vorhandenen Daten vor.",
  },
  422: {
    title: "Ungültige Daten",
    description: "Die übertragenen Daten sind nicht gültig.",
  },
  429: {
    title: "Zu viele Anfragen",
    description:
      "Sie haben zu viele Anfragen gesendet. Versuchen Sie es später erneut.",
  },
  500: {
    title: "Server-Fehler",
    description: "Ein interner Server-Fehler ist aufgetreten.",
  },
  502: {
    title: "Server nicht erreichbar",
    description: "Der Server ist vorübergehend nicht erreichbar.",
  },
  503: {
    title: "Service nicht verfügbar",
    description: "Der Service ist vorübergehend nicht verfügbar.",
  },
  504: {
    title: "Server-Timeout",
    description: "Der Server antwortet nicht rechtzeitig.",
  },
};

// Context information for better error messages
export interface ErrorContext {
  action?: string; // e.g., 'saving task', 'loading data'
  resource?: string; // e.g., 'task', 'note', 'flashcard'
  operation?: "create" | "update" | "delete" | "fetch" | "sync";
  retryable?: boolean;
  onRetry?: () => void | Promise<void>;
}

// Configuration for error notifications
export interface ErrorNotificationConfig {
  /** Show the error notification (default: true) */
  show?: boolean;
  /** Duration in milliseconds (default: based on error type) */
  duration?: number;
  /** Allow dismissal (default: true) */
  dismissible?: boolean;
  /** Show retry button for retryable errors (default: true) */
  showRetry?: boolean;
  /** Custom toast position */
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

/**
 * Show user-friendly error notification based on error type and context
 */
export function showErrorNotification(
  error: Error,
  context: ErrorContext = {},
  config: ErrorNotificationConfig = {},
) {
  const {
    show = true,
    dismissible = true,
    showRetry = true,
    duration,
  } = config;

  if (!show) return;

  let message = errorMessages.generic;
  let isRetryable = false;
  let defaultDuration = 5000;

  // Determine error type and appropriate message
  if (error instanceof NetworkError) {
    message = errorMessages.network;
    isRetryable = true;
    defaultDuration = 8000;
  } else if (error instanceof TimeoutError) {
    message = errorMessages.timeout;
    isRetryable = true;
    defaultDuration = 6000;
  } else if (error instanceof ValidationError) {
    message = errorMessages.validation;
    isRetryable = false;
    defaultDuration = 7000;
  } else if (error instanceof ApiError) {
    const statusCode = error.statusCode || 0;

    if (httpStatusMessages[statusCode]) {
      message = {
        title: httpStatusMessages[statusCode].title,
        description: httpStatusMessages[statusCode].description,
        retry: statusCode >= 500 ? "Erneut versuchen" : "",
      };
      isRetryable = statusCode >= 500 || statusCode === 429;
    } else if (statusCode >= 500) {
      message = errorMessages.server;
      isRetryable = true;
    } else if (statusCode >= 400) {
      message = errorMessages.client;
      isRetryable = false;
    }

    defaultDuration = isRetryable ? 8000 : 6000;
  }

  // Override retryable based on context
  if (context.retryable !== undefined) {
    isRetryable = context.retryable;
  }

  // Build contextual message
  let title = message.title;
  let description = message.description;

  if (context.action && context.resource) {
    const actionText = getActionText(context.operation, context.resource);
    title = `Fehler beim ${actionText}`;
    description = `${message.description} (${context.resource})`;
  } else if (context.action) {
    title = `Fehler bei: ${context.action}`;
  }

  // Show the notification
  const toastDuration = duration ?? defaultDuration;

  if (isRetryable && showRetry && context.onRetry) {
    // Show error with retry action
    toast.error(title, {
      description,
      duration: toastDuration,
      dismissible,
      action: {
        label: message.retry || "Erneut versuchen",
        onClick: () => {
          if (context.onRetry) {
            try {
              const result = context.onRetry();
              if (result instanceof Promise) {
                result.catch((retryError) => {
                  // Show error for retry failure
                  showErrorNotification(retryError, {
                    ...context,
                    retryable: false, // Don't show retry for retry failures
                  });
                });
              }
            } catch (retryError) {
              showErrorNotification(retryError as Error, {
                ...context,
                retryable: false,
              });
            }
          }
        },
      },
    });
  } else {
    // Show simple error notification
    toast.error(title, {
      description,
      duration: toastDuration,
      dismissible,
    });
  }

  // Log detailed error information for debugging
  console.error("[ErrorNotification]", {
    error: error.message,
    type: error.constructor.name,
    context,
    stack: error.stack,
  });
}

/**
 * Show success notification for completed actions
 */
export function showSuccessNotification(
  message: string,
  context: ErrorContext = {},
  config: Pick<ErrorNotificationConfig, "duration" | "dismissible"> = {},
) {
  const { duration = 3000, dismissible = true } = config;

  let title = message;
  if (context.action && context.resource) {
    const actionText = getActionText(context.operation, context.resource);
    title = `${context.resource} erfolgreich ${getActionPastTense(context.operation)}`;
  }

  toast.success(title, {
    duration,
    dismissible,
  });
}

/**
 * Show info notification
 */
export function showInfoNotification(
  title: string,
  description?: string,
  config: Pick<ErrorNotificationConfig, "duration" | "dismissible"> = {},
) {
  const { duration = 4000, dismissible = true } = config;

  toast.info(title, {
    description,
    duration,
    dismissible,
  });
}

/**
 * Show offline notification
 */
export function showOfflineNotification() {
  toast.warning(errorMessages.offline.title, {
    description: errorMessages.offline.description,
    duration: 6000,
    dismissible: true,
  });
}

/**
 * Show sync notification
 */
export function showSyncNotification(success: boolean, onRetry?: () => void) {
  if (success) {
    toast.success("Synchronisierung erfolgreich", {
      description: "Alle Daten wurden synchronisiert.",
      duration: 2000,
    });
  } else {
    toast.error(errorMessages.sync.title, {
      description: errorMessages.sync.description,
      duration: 6000,
      action: onRetry
        ? {
            label: errorMessages.sync.retry,
            onClick: onRetry,
          }
        : undefined,
    });
  }
}

// Helper functions for contextual messages
function getActionText(operation?: string, resource?: string): string {
  const resourceText = resource || "Element";

  switch (operation) {
    case "create":
      return `Erstellen von ${resourceText}`;
    case "update":
      return `Aktualisieren von ${resourceText}`;
    case "delete":
      return `Löschen von ${resourceText}`;
    case "fetch":
      return `Laden von ${resourceText}`;
    case "sync":
      return `Synchronisieren von ${resourceText}`;
    default:
      return `Verarbeiten von ${resourceText}`;
  }
}

function getActionPastTense(operation?: string): string {
  switch (operation) {
    case "create":
      return "erstellt";
    case "update":
      return "aktualisiert";
    case "delete":
      return "gelöscht";
    case "fetch":
      return "geladen";
    case "sync":
      return "synchronisiert";
    default:
      return "verarbeitet";
  }
}

/**
 * Handle API errors with automatic notification
 * This is a convenience function to use with the API client
 */
export function handleApiError(error: Error, context: ErrorContext = {}) {
  showErrorNotification(error, context);
}

/**
 * Wrapper for API calls that automatically handles errors
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  context: ErrorContext = {},
  config: ErrorNotificationConfig = {},
): Promise<T | null> {
  try {
    const result = await apiCall();

    // Show success notification if specified
    if (context.action && context.resource && context.operation !== "fetch") {
      showSuccessNotification("", context);
    }

    return result;
  } catch (error) {
    showErrorNotification(error as Error, context, config);
    return null;
  }
}
