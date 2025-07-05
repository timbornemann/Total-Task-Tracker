import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskStoreProvider } from "@/hooks/useTaskStore";
import { CurrentCategoryProvider } from "@/hooks/useCurrentCategory";
import { SettingsProvider } from "@/hooks/useSettings";
import { FlashcardStoreProvider } from "@/hooks/useFlashcardStore";
import ServiceWorkerManager from "@/components/ServiceWorkerManager";
import CommandPalette from "@/components/CommandPalette";
import Home from "./pages/Home";
import TasksPage from "./pages/Tasks";
import Statistics from "./pages/Statistics";
import Kanban from "./pages/Kanban";
import NotesPage from "./pages/Notes";
import NoteDetailPage from "./pages/NoteDetail";
import FlashcardsPage from "./pages/Flashcards";
import FlashcardManagerPage from "./pages/FlashcardManager";
import DeckDetailPage from "./pages/DeckDetail";
import FlashcardStatisticsPage from "./pages/FlashcardStatistics";
import SettingsPage from "./pages/Settings";
import ReleaseNotesPage from "./pages/ReleaseNotes";
import NotFound from "./pages/NotFound";
import PomodoroPage from "./pages/Pomodoro";
import PomodoroHistoryPage from "./pages/PomodoroHistory";
import PomodoroTimer from "@/components/PomodoroTimer";
import PomodoroTicker from "@/components/PomodoroTicker";
import TimerTicker from "@/components/TimerTicker";
import TimersPage from "./pages/Timers";
import TimerDetailPage from "./pages/TimerDetail";
import ClockPage from "./pages/Clock";
import { PomodoroHistoryProvider } from "@/hooks/usePomodoroHistory.tsx";
import ReleaseNotesModal from "@/components/ReleaseNotesModal";
import SurprisePage from "./pages/Surprise";
import SurpriseListener from "@/components/SurpriseListener";
import RecurringTasksPage from "./pages/RecurringTasks";
import HabitTrackerPage from "./pages/HabitTracker";
import TimeBlockingPage from "./pages/TimeBlocking";
import TaskDetailPage from "./pages/TaskDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <ServiceWorkerManager />
        <PomodoroHistoryProvider>
          <TaskStoreProvider>
            <FlashcardStoreProvider>
              <CurrentCategoryProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <SurpriseListener />
                  <CommandPalette />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/kanban" element={<Kanban />} />
                    <Route path="/recurring" element={<RecurringTasksPage />} />
                    <Route path="/habits" element={<HabitTrackerPage />} />
                    <Route path="/timeblocks" element={<TimeBlockingPage />} />
                    <Route
                      path="/flashcards/manage"
                      element={<FlashcardManagerPage />}
                    />
                    <Route
                      path="/flashcards/deck/:deckId"
                      element={<DeckDetailPage />}
                    />
                    <Route path="/flashcards" element={<FlashcardsPage />} />
                    <Route
                      path="/flashcards/stats"
                      element={<FlashcardStatisticsPage />}
                    />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/notes/:id" element={<NoteDetailPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route
                      path="/release-notes"
                      element={<ReleaseNotesPage />}
                    />
                    <Route path="/pomodoro" element={<PomodoroPage />} />
                    <Route
                      path="/pomodoro/history"
                      element={<PomodoroHistoryPage />}
                    />
                    <Route path="/timers" element={<TimersPage />} />
                    <Route path="/timers/:id" element={<TimerDetailPage />} />
                    <Route path="/clock" element={<ClockPage />} />
                    <Route path="/surprise" element={<SurprisePage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                <PomodoroTimer compact />
                <PomodoroTicker />
                <TimerTicker />
                <ReleaseNotesModal />
              </CurrentCategoryProvider>
            </FlashcardStoreProvider>
          </TaskStoreProvider>
        </PomodoroHistoryProvider>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
