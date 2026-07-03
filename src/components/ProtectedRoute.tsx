import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, type RouteProps } from "wouter";

export function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> } & RouteProps) {
    const { user, isLoading } = useAuth();

    // FIX: Show loading only briefly, don't block indefinitely
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        // FIX #13: Validate redirect path to prevent open redirect
        const path = typeof rest.path === "string" ? rest.path : window.location.pathname;
        const safePath = path.startsWith('/') ? path : '/teammates';
        return (
            <Route {...rest}>
                <Redirect to={`/login?redirect=${encodeURIComponent(safePath)}`} />
            </Route>
        );
    }

    // Check if user is banned
    if (user.isBanned) {
        // Store ban reason in localStorage for the banned page to display
        if (user.banReason) {
            localStorage.setItem("banReason", user.banReason);
        }
        return (
            <Route {...rest}>
                <Redirect to="/banned" />
            </Route>
        );
    }

    // FIX BUG #2: Check if user has completed onboarding
    const hasCompletedOnboarding = user.skills && user.skills.length > 0 && user.city && user.university;
    if (!hasCompletedOnboarding && !user.isAdmin) {
        return (
            <Route {...rest}>
                <Redirect to="/onboarding" />
            </Route>
        );
    }

    return <Route component={Component} {...rest} />;
}
