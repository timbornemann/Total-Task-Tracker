/**
 * UI component to show offline status and queue information
 */

import React from 'react';
import { Wifi, WifiOff, Upload, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOfflineQueue, useQueueStats } from '@/hooks/useOfflineQueue';
import { cn } from '@/lib/utils';

interface OfflineStatusIndicatorProps {
  /** Show detailed queue information */
  detailed?: boolean;
  /** Position of the indicator */
  position?: 'fixed' | 'relative';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show only when offline or has queued items */
  autoHide?: boolean;
  className?: string;
}

export function OfflineStatusIndicator({
  detailed = false,
  position = 'fixed',
  size = 'md',
  autoHide = true,
  className,
}: OfflineStatusIndicatorProps) {
  const {
    isOnline,
    isProcessing,
    totalQueueLength,
    processQueue,
    clearQueue,
    lastSyncAttempt,
    consecutiveFailures,
  } = useOfflineQueue();

  // Hide if auto-hide is enabled and we're online with no queue
  if (autoHide && isOnline && totalQueueLength === 0 && !isProcessing) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (isProcessing) return 'default';
    if (totalQueueLength > 0) return 'warning';
    return 'default';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (isProcessing) return <Upload className="h-4 w-4 animate-pulse" />;
    if (totalQueueLength > 0) return <Clock className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isProcessing) return 'Synchronisiert...';
    if (totalQueueLength > 0) return `${totalQueueLength} ausstehend`;
    return 'Online';
  };

  const formatLastSync = () => {
    if (!lastSyncAttempt) return 'Nie';
    const diff = Date.now() - lastSyncAttempt;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    return 'vor mehr als einem Tag';
  };

  if (!detailed) {
    // Simple badge indicator
    return (
      <Badge
        variant={getStatusColor()}
        className={cn(
          'flex items-center gap-2',
          position === 'fixed' && 'fixed bottom-4 right-4 z-50',
          size === 'sm' && 'text-xs px-2 py-1',
          size === 'lg' && 'text-sm px-3 py-2',
          className
        )}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>
    );
  }

  // Detailed card view
  return (
    <Card
      className={cn(
        'w-80',
        position === 'fixed' && 'fixed bottom-4 right-4 z-50',
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getStatusIcon()}
          <span>Verbindungsstatus</span>
          <Badge variant={getStatusColor()} className="ml-auto">
            {getStatusText()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Letzter Sync: {formatLastSync()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Verbindung</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Queue Information */}
        {totalQueueLength > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Warteschlange</span>
              <span className="text-sm">{totalQueueLength} Operationen</span>
            </div>
            
            {isProcessing && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Wird verarbeitet...</span>
                  <Upload className="h-3 w-3 animate-pulse" />
                </div>
                <Progress value={undefined} className="h-1" />
              </div>
            )}
          </div>
        )}

        {/* Error Information */}
        {consecutiveFailures > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{consecutiveFailures} fehlgeschlagene Versuche</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOnline && totalQueueLength > 0 && !isProcessing && (
            <Button
              size="sm"
              onClick={processQueue}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Jetzt synchronisieren
            </Button>
          )}
          
          {totalQueueLength > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearQueue}
              className={cn(isOnline && !isProcessing ? 'flex-1' : 'w-full')}
            >
              Warteschlange leeren
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple status badge for navigation bars
 */
export function OfflineStatusBadge({ className }: { className?: string }) {
  return (
    <OfflineStatusIndicator
      detailed={false}
      position="relative"
      size="sm"
      autoHide={true}
      className={className}
    />
  );
}

/**
 * Full status card for settings or debug views
 */
export function OfflineStatusCard({ className }: { className?: string }) {
  return (
    <OfflineStatusIndicator
      detailed={true}
      position="relative"
      autoHide={false}
      className={className}
    />
  );
}

/**
 * Floating status indicator that appears automatically
 */
export function FloatingOfflineIndicator() {
  return (
    <OfflineStatusIndicator
      detailed={false}
      position="fixed"
      size="md"
      autoHide={true}
    />
  );
}
