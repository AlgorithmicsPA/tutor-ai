import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeechProvider } from "@/contexts/SpeechContext";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLessonsPage from "@/pages/admin/lessons";
import LessonEditorPage from "@/pages/admin/lesson-editor";
import LessonViewPage from "@/pages/lesson-view";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/lessons/:lessonId" component={LessonViewPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} requireAdmin={true} />
      <ProtectedRoute path="/admin/lessons" component={AdminLessonsPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/lessons/:lessonId" component={LessonEditorPage} requireAdmin={true} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SpeechProvider>
            <Toaster />
            <Router />
          </SpeechProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
