import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeechProvider } from "@/contexts/SpeechContext";
import Home from "@/pages/home";
import AdminLessonsPage from "@/pages/admin/lessons";
import LessonEditorPage from "@/pages/admin/lesson-editor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/lessons" component={AdminLessonsPage} />
      <Route path="/admin/lessons/:lessonId" component={LessonEditorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SpeechProvider>
          <Toaster />
          <Router />
        </SpeechProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
