import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, type RouteProps } from "wouter";

export function OrganizerRoute({ component: Component, ...rest }: { component: React.ComponentType<any> } & RouteProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Route {...rest}>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Route>
        );
    }

    // Check if user is banned first
    if (user && user.isBanned) {
        if (user.banReason) {
            localStorage.setItem("banReason", user.banReason);
        }
        return (
            <Route {...rest}>
                <Redirect to="/banned" />
            </Route>
        );
    }

    if (!user || (!user.isOrganiser && !user.isAdmin)) {
        // Redirect non-organisers away from organiser routes
        return (
            <Route {...rest}>
                <Redirect to="/" />
            </Route>
        );
    }

    return <Route component={Component} {...rest} />;
}
