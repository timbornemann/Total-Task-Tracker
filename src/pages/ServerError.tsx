/**
 * Server error page for 500 and other server-side errors
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorPage } from '@/components/ErrorPage';
import { Button } from '@/components/ui/button';
import { Bug, Mail } from 'lucide-react';

export default function ServerError() {
  const [searchParams] = useSearchParams();
  
  // Get error details from URL params (if provided)
  const statusCode = parseInt(searchParams.get('status') || '500');
  const message = searchParams.get('message');
  const details = searchParams.get('details');

  const getStatusInfo = (code: number) => {
    switch (code) {
      case 500:
        return {
          title: 'Interner Server-Fehler',
          description: 'Auf dem Server ist ein unerwarteter Fehler aufgetreten. Unser Team wurde benachrichtigt.',
        };
      case 502:
        return {
          title: 'Bad Gateway',
          description: 'Der Server ist vorübergehend nicht erreichbar. Bitte versuchen Sie es in wenigen Minuten erneut.',
        };
      case 503:
        return {
          title: 'Service nicht verfügbar',
          description: 'Der Service ist vorübergehend nicht verfügbar. Möglicherweise führen wir gerade Wartungsarbeiten durch.',
        };
      case 504:
        return {
          title: 'Gateway Timeout',
          description: 'Der Server antwortet nicht rechtzeitig. Bitte versuchen Sie es in wenigen Minuten erneut.',
        };
      default:
        return {
          title: 'Server-Fehler',
          description: 'Ein Server-Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        };
    }
  };

  const statusInfo = getStatusInfo(statusCode);
  const finalTitle = message || statusInfo.title;
  const finalDescription = statusInfo.description;

  const customActions = (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={() => window.location.href = 'mailto:support@example.com?subject=Server Error Report'}
        className="w-full"
      >
        <Mail className="mr-2 h-4 w-4" />
        Problem melden
      </Button>
      
      <Button
        variant="ghost"
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: 'Server Error',
              text: `Error ${statusCode}: ${finalTitle}`,
              url: window.location.href,
            });
          } else {
            navigator.clipboard.writeText(
              `Error ${statusCode} at ${window.location.href}: ${finalTitle}`
            );
          }
        }}
        className="w-full"
      >
        <Bug className="mr-2 h-4 w-4" />
        Fehlerdetails teilen
      </Button>
    </div>
  );

  return (
    <ErrorPage
      statusCode={statusCode}
      title={finalTitle}
      description={finalDescription}
      details={details || undefined}
      customActions={customActions}
      showRefreshButton={true}
    />
  );
}
