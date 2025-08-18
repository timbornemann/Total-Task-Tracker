import { useLocation, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { ErrorPage } from "@/components/ErrorPage";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get any additional context from URL params
  const attemptedPath = searchParams.get('path') || location.pathname;
  const referrer = searchParams.get('from');

  // Suggest similar routes based on the attempted path
  const getSuggestions = (path: string) => {
    const suggestions: { label: string; path: string }[] = [];
    
    if (path.includes('task')) {
      suggestions.push({ label: 'Aufgaben', path: '/tasks' });
      suggestions.push({ label: 'Kanban Board', path: '/kanban' });
    }
    if (path.includes('note')) {
      suggestions.push({ label: 'Notizen', path: '/notes' });
    }
    if (path.includes('flashcard') || path.includes('card')) {
      suggestions.push({ label: 'Karteikarten', path: '/flashcards' });
    }
    if (path.includes('pomodoro') || path.includes('timer')) {
      suggestions.push({ label: 'Pomodoro Timer', path: '/pomodoro' });
      suggestions.push({ label: 'Timer', path: '/timers' });
    }
    if (path.includes('habit')) {
      suggestions.push({ label: 'Gewohnheiten', path: '/habits' });
    }
    if (path.includes('inventory')) {
      suggestions.push({ label: 'Inventar', path: '/inventory' });
    }
    if (path.includes('work') || path.includes('log')) {
      suggestions.push({ label: 'Arbeitsprotokoll', path: '/worklog' });
    }
    if (path.includes('stat')) {
      suggestions.push({ label: 'Statistiken', path: '/statistics' });
    }
    if (path.includes('setting')) {
      suggestions.push({ label: 'Einstellungen', path: '/settings' });
    }

    // Add default suggestions if no specific matches
    if (suggestions.length === 0) {
      suggestions.push(
        { label: 'Startseite', path: '/' },
        { label: 'Aufgaben', path: '/tasks' },
        { label: 'Notizen', path: '/notes' },
      );
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const suggestions = getSuggestions(attemptedPath);

  const customActions = suggestions.length > 0 ? (
    <div className="space-y-2">
      <p className="text-sm font-medium text-center mb-3">
        Vielleicht suchten Sie nach:
      </p>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => navigate(suggestion.path)}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            <Search className="mr-2 h-4 w-4" />
            {suggestion.label}
          </div>
          <ArrowRight className="h-4 w-4" />
        </Button>
      ))}
    </div>
  ) : null;

  return (
    <ErrorPage
      statusCode={404}
      title="Seite nicht gefunden"
      description={`Die Seite "${attemptedPath}" konnte nicht gefunden werden.`}
      details={referrer ? `Referrer: ${referrer}` : undefined}
      customActions={customActions}
      showRefreshButton={false}
    />
  );
};

export default NotFound;
