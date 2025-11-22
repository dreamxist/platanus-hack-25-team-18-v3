import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import AppLayout from "./components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import NameInputPage from "./pages/NameInputPage";
import TopicsPage from "./pages/TopicsPage";
import SwipePage from "./pages/SwipePage";
import TopicSwipePage from "./pages/TopicSwipePage";
import MatchPage from "./pages/MatchPage";
import ChatPage from "./pages/ChatPage";
import RevealPage from "./pages/RevealPage";
import VotingResultsPage from "./pages/VotingResultsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/topics" element={<TopicsPage />} />
                <Route path="/swipe" element={<SwipePage />} />
                <Route path="/topic-swipe" element={<TopicSwipePage />} />
                <Route path="/match" element={<MatchPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/reveal" element={<RevealPage />} />
                <Route path="/voting-results" element={<VotingResultsPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
