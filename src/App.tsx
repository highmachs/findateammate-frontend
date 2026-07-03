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

// Lazy Load Non-Critical Pages for Performance
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react"; // Or any spinner

const Profile = lazy(() => import("@/pages/Profile"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const Browse = lazy(() => import("@/pages/Browse"));
const PostDetail = lazy(() => import("@/pages/PostDetail"));
const CreatePost = lazy(() => import("@/pages/CreatePost"));
const Requests = lazy(() => import("@/pages/Requests"));
const Chat = lazy(() => import("@/pages/Chat"));
const MyPosts = lazy(() => import("@/pages/MyPosts"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Guidelines = lazy(() => import("@/pages/Guidelines"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Safety = lazy(() => import("@/pages/Safety"));
const Report = lazy(() => import("@/pages/Report"));
const Events = lazy(() => import("@/pages/Events"));
const OrganizerDashboard = lazy(() => import("@/pages/OrganizerDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Maintenance = lazy(() => import("@/pages/Maintenance"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
