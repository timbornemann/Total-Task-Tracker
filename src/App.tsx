
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskStoreProvider } from "@/hooks/useTaskStore";
import { CurrentCategoryProvider } from "@/hooks/useCurrentCategory";
import { SettingsProvider } from "@/hooks/useSettings";
import { FlashcardStoreProvider } from "@/hooks/useFlashcardStore";
import CommandPalette from "@/components/CommandPalette";
import Home from "./pages/Home";
import TasksPage from "./pages/Tasks";
import Statistics from "./pages/Statistics";
import CalendarPage from "./pages/Calendar";
import Kanban from "./pages/Kanban";
import NotesPage from "./pages/Notes";
import NoteDetailPage from "./pages/NoteDetail";
import FlashcardsPage from "./pages/Flashcards";
import FlashcardManagerPage from "./pages/FlashcardManager";
import DeckDetailPage from "./pages/DeckDetail";
import FlashcardStatisticsPage from "./pages/FlashcardStatistics";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PomodoroPage from "./pages/Pomodoro";
import PomodoroTimer from "@/components/PomodoroTimer";
import PomodoroTicker from "@/components/PomodoroTicker";
import { PomodoroHistoryProvider } from "@/hooks/usePomodoroHistory.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <PomodoroHistoryProvider>
          <TaskStoreProvider>
            <FlashcardStoreProvider>
              <CurrentCategoryProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CommandPalette />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/flashcards/manage" element={<FlashcardManagerPage />} />
              <Route path="/flashcards/deck/:deckId" element={<DeckDetailPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/flashcards/stats" element={<FlashcardStatisticsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/notes/:id" element={<NoteDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <PomodoroTimer compact />
            <PomodoroTicker />
            </CurrentCategoryProvider>
          </FlashcardStoreProvider>
        </TaskStoreProvider>
        </PomodoroHistoryProvider>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
