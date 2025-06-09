
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskStoreProvider } from "@/hooks/useTaskStore";
import { CurrentCategoryProvider } from "@/hooks/useCurrentCategory";
import { SettingsProvider } from "@/hooks/useSettings";
import CommandPalette from "@/components/CommandPalette";
import Index from "./pages/Index";
import Statistics from "./pages/Statistics";
import CalendarPage from "./pages/Calendar";
import Kanban from "./pages/Kanban";
import NotesPage from "./pages/Notes";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <TaskStoreProvider>
          <CurrentCategoryProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CommandPalette />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CurrentCategoryProvider>
        </TaskStoreProvider>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
