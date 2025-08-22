/**
 * Consolidated app providers to reduce nesting and improve maintainability
 */

import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServiceWorkerManager from "@/components/ServiceWorkerManager";
import CommandPalette from "@/components/CommandPalette";
import SurpriseListener from "@/components/SurpriseListener";
import PomodoroTimer from "@/components/PomodoroTimer";
import PomodoroTicker from "@/components/PomodoroTicker";
import TimerTicker from "@/components/TimerTicker";
import ReleaseNotesModal from "@/components/ReleaseNotesModal";
import { FloatingOfflineIndicator } from "@/components/OfflineStatusIndicator";

// Individual provider imports
import { SettingsProvider } from "@/hooks/useSettings";
import { TaskStoreProvider } from "@/hooks/useTaskStore";
import { CurrentCategoryProvider } from "@/hooks/useCurrentCategory";
import { FlashcardStoreProvider } from "@/hooks/useFlashcardStore";
import { HabitStoreProvider } from "@/hooks/useHabitStore";
import { InventoryProvider } from "@/hooks/useInventoryStore";
import { PomodoroHistoryProvider } from "@/hooks/usePomodoroHistory";
import { TimersProvider } from "@/hooks/useTimers";
import { WorklogProvider } from "@/hooks/useWorklog";

interface AppProvidersProps {
  children: ReactNode;
}

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Core infrastructure providers (Level 1)
 * Essential providers that need to be at the root
 */
function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

/**
 * Combined state provider that flattens all app providers
 * Reduces nesting by composing providers instead of nesting them
 */
function CombinedStateProvider({ children }: { children: ReactNode }) {
  // Compose all providers in a flat array to avoid deep nesting
  const providers = [
    SettingsProvider,
    TaskStoreProvider,
    CurrentCategoryProvider,
    FlashcardStoreProvider,
    HabitStoreProvider,
    InventoryProvider,
    PomodoroHistoryProvider,
    TimersProvider,
    WorklogProvider,
  ];

  // Reduce providers from right to left to create a flat composition
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children as ReactNode,
  );
}

/**
 * UI overlay components (Level 3)
 * Non-provider components that need to be rendered globally
 */
function UIOverlays() {
  return (
    <>
      {/* Toast systems */}
      <Toaster />
      <Sonner />

      {/* Global UI components */}
      <CommandPalette />
      <SurpriseListener />

      {/* Timer components */}
      <PomodoroTimer compact />
      <PomodoroTicker />
      <TimerTicker />

      {/* Modals and overlays */}
      <ReleaseNotesModal />
      <FloatingOfflineIndicator />

      {/* Service worker */}
      <ServiceWorkerManager />
    </>
  );
}

/**
 * Main app providers with optimized structure
 * Reduces nesting from 12 levels to 3 levels
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CoreProviders>
      <CombinedStateProvider>
        <>
          {children}
          <UIOverlays />
        </>
      </CombinedStateProvider>
    </CoreProviders>
  );
}

// Export individual provider groups for testing and flexibility
export { CoreProviders, CombinedStateProvider, UIOverlays, queryClient };
