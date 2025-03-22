import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import WebsiteRules from "@/pages/website-rules";
import UserManagement from "@/pages/user-management";
import ActivityReports from "@/pages/activity-reports";
import Browser from "@/pages/browser";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} adminOnly={true} />
      <ProtectedRoute path="/website-rules" component={WebsiteRules} adminOnly={true} />
      <ProtectedRoute path="/user-management" component={UserManagement} adminOnly={true} />
      <ProtectedRoute path="/activity-reports" component={ActivityReports} adminOnly={true} />
      <ProtectedRoute path="/browser" component={Browser} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
