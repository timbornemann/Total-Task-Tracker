/**
 * Generic error page component for consistent error handling
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Home, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

export interface ErrorPageProps {
  /** Error status code */
  statusCode: number;
  /** Error title */
  title?: string;
  /** Error description */
  description?: string;
  /** Show navigation bar */
  showNavbar?: boolean;
  /** Show go back button */
  showBackButton?: boolean;
  /** Show home button */
  showHomeButton?: boolean;
  /** Show refresh button */
  showRefreshButton?: boolean;
  /** Custom action buttons */
  customActions?: React.ReactNode;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Additional error details for debugging */
  details?: string;
  /** Show error details in development */
  showDetails?: boolean;
}

export function ErrorPage({
  statusCode,
  title,
  description,
  showNavbar = true,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = true,
  customActions,
  icon,
  details,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Default content based on status code
  const getDefaultContent = () => {
    switch (statusCode) {
      case 404:
        return {
          title: t('errors.404.title', 'Seite nicht gefunden'),
          description: t('errors.404.description', 'Die angeforderte Seite konnte nicht gefunden werden.'),
          icon: <Search className="h-12 w-12 text-muted-foreground" />,
        };
      case 500:
        return {
          title: t('errors.500.title', 'Server-Fehler'),
          description: t('errors.500.description', 'Ein interner Server-Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'),
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
        };
      case 503:
        return {
          title: t('errors.503.title', 'Service nicht verfügbar'),
          description: t('errors.503.description', 'Der Service ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.'),
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
        };
      default:
        return {
          title: t('errors.generic.title', 'Ein Fehler ist aufgetreten'),
          description: t('errors.generic.description', 'Es ist ein unerwarteter Fehler aufgetreten.'),
          icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalDescription = description || defaultContent.description;
  const finalIcon = icon || defaultContent.icon;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Log error for debugging
  React.useEffect(() => {
    console.error(`${statusCode} Error:`, {
      path: location.pathname,
      title: finalTitle,
      description: finalDescription,
      details,
    });
  }, [statusCode, location.pathname, finalTitle, finalDescription, details]);

  const content = (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-muted rounded-full w-fit">
            {finalIcon}
          </div>
          <div className="space-y-2">
            <div className="text-6xl font-bold text-muted-foreground">
              {statusCode}
            </div>
            <CardTitle className="text-2xl">{finalTitle}</CardTitle>
            <CardDescription className="text-base">
              {finalDescription}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error details for development */}
          {showDetails && details && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Debug Information:</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {details}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {showBackButton && (
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.goBack', 'Zurück')}
              </Button>
            )}
            
            {showHomeButton && (
              <Button onClick={handleGoHome} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                {t('common.goHome', 'Zur Startseite')}
              </Button>
            )}
          </div>

          {showRefreshButton && (
            <Button variant="outline" onClick={handleRefresh} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.refresh', 'Seite aktualisieren')}
            </Button>
          )}

          {/* Custom actions */}
          {customActions && (
            <div className="pt-2">
              {customActions}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (showNavbar) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar title={finalTitle} />
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {content}
    </div>
  );
}
