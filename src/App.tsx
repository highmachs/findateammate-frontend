import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { useUpdateDetection } from "@/hooks/use-update-detection";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { OrganizerRoute } from "@/components/OrganizerRoute";
import { Footer } from "@/components/Footer";
import { GlobalListener } from "@/components/GlobalListener";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";
import BannedPage from "@/pages/BannedPage";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Profile from "@/pages/Profile";
import PublicProfile from "@/pages/PublicProfile";
import Browse from "@/pages/Browse";
import PostDetail from "@/pages/PostDetail";
import CreatePost from "@/pages/CreatePost";
import Requests from "@/pages/Requests";
import Chat from "@/pages/Chat";
import MyPosts from "@/pages/MyPosts";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Guidelines from "@/pages/Guidelines";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Safety from "@/pages/Safety";
import Report from "@/pages/Report";
import Events from "@/pages/Events";
import OrganizerDashboard from "@/pages/OrganizerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import FAQ from "@/pages/FAQ";
import Notifications from "@/pages/Notifications";
import Maintenance from "@/pages/Maintenance";
import Onboarding from "@/pages/Onboarding";

import { initMonitor } from "./lib/monitor";
import { MaintenanceProvider } from "@/hooks/use-maintenance";

// Minimal Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Router() {
  useEffect(() => {
    initMonitor();
  }, []);

  return (
    <>
      <Switch>
        <Route path="/dashboard">
          <Redirect to="/admin" />
        </Route>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/banned" component={BannedPage} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/guidelines" component={Guidelines} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/safety" component={Safety} />
        <Route path="/faq" component={FAQ} />
        <Route path="/report" component={Report} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/onboarding" component={Onboarding} />
        <ProtectedRoute path="/events" component={Events} />
        <OrganizerRoute path="/organiser" component={OrganizerDashboard} />
        <OrganizerRoute path="/organizer" component={OrganizerDashboard} />
        
        <ProtectedRoute path="/teammates" component={Browse} />
        <ProtectedRoute path="/teammates/:id" component={PostDetail} />
        <Route path="/profile/:id" component={PublicProfile} />
        
        <ProtectedRoute path="/create-post/:mode" component={CreatePost} />
        <ProtectedRoute path="/create-post" component={CreatePost} />
        <ProtectedRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/requests" component={Requests} />
        <ProtectedRoute path="/chat" component={Chat} />
        <ProtectedRoute path="/chat/:id" component={Chat} />
        <ProtectedRoute path="/my-posts" component={MyPosts} />
        <ProtectedRoute path="/notifications" component={Notifications} />
        
        <AdminRoute path="/admin" component={AdminDashboard} />
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
    const [location] = useLocation();
    
    // Check for app updates
    useUpdateDetection();

    // Hide footer on auth pages
    const isAuthPage = location === "/login" || location === "/register" || location === "/onboarding";
    const showFooter = !isAuthPage;

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <main className="flex-grow">
                {children}
            </main>
            {showFooter && <Footer />}
            <GlobalListener />
        </div>
    );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MaintenanceProvider>
            <Layout>
                <Router />
            </Layout>
            <Toaster />
        </MaintenanceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
