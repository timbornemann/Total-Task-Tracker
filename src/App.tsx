import { Routes, Route } from "react-router-dom";
import { AppProviders } from "@/providers/AppProviders";
// Page imports
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
import ServerError from "./pages/ServerError";
import PomodoroPage from "./pages/Pomodoro";
import PomodoroHistoryPage from "./pages/PomodoroHistory";
import TimersPage from "./pages/Timers";
import TimerDetailPage from "./pages/TimerDetail";
import WorklogPage from "./pages/Worklog";
import WorklogDetailPage from "./pages/WorklogDetail";
import WorklogStatsPage from "./pages/WorklogStats";
import ClockPage from "./pages/Clock";
import SurprisePage from "./pages/Surprise";
import RecurringTasksPage from "./pages/RecurringTasks";
import HabitTrackerPage from "./pages/HabitTracker";
import TimeBlockingPage from "./pages/TimeBlocking";
import TaskDetailPage from "./pages/TaskDetail";
import InventoryPage from "./pages/Inventory";
import InventoryDetailPage from "./pages/InventoryDetail";

const App = () => (
  <AppProviders>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/kanban" element={<Kanban />} />
      <Route path="/recurring" element={<RecurringTasksPage />} />
      <Route path="/habits" element={<HabitTrackerPage />} />
      <Route path="/timeblocks" element={<TimeBlockingPage />} />
      <Route path="/flashcards/manage" element={<FlashcardManagerPage />} />
      <Route path="/flashcards/deck/:deckId" element={<DeckDetailPage />} />
      <Route path="/flashcards" element={<FlashcardsPage />} />
      <Route path="/flashcards/stats" element={<FlashcardStatisticsPage />} />
      <Route path="/notes" element={<NotesPage />} />
      <Route path="/notes/:id" element={<NoteDetailPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/inventory/:id" element={<InventoryDetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/release-notes" element={<ReleaseNotesPage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
      <Route path="/pomodoro/history" element={<PomodoroHistoryPage />} />
      <Route path="/timers" element={<TimersPage />} />
      <Route path="/timers/:id" element={<TimerDetailPage />} />
      <Route path="/clock" element={<ClockPage />} />
      <Route path="/worklog" element={<WorklogPage />} />
      <Route path="/worklog/:id" element={<WorklogDetailPage />} />
      <Route path="/worklog/stats" element={<WorklogStatsPage />} />
      <Route path="/surprise" element={<SurprisePage />} />
      <Route path="/error" element={<ServerError />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AppProviders>
);

export default App;
