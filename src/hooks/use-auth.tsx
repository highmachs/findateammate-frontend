import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, queryClient, clearCsrfToken } from "@/lib/queryClient";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
// import { useStore } from "@/hooks/use-store";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    logoutMutation: UseMutationResult<void, Error, void>;
    fetchUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const {
        data: user,
        error,
        isLoading,
    } = useQuery<User | null, Error>({
        queryKey: ["/api/me"],
        queryFn: getQueryFn({ on401: "returnNull" }),
    });

    const logoutMutation = useMutation<void, Error, void>({
        mutationFn: () => logout(),
        onSuccess: () => {
            clearCsrfToken();
            queryClient.setQueryData(["/api/me"], null);
            // Clear all onboarding drafts and sensitive localStorage data
            localStorage.removeItem("onboarding_draft");
            localStorage.removeItem("cookie-consent"); // Re-show consent on next login
        },
        onError: (error: Error) => {
            toast({
                title: "Logout failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const fetchUser = async () => {
        await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    };

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                error: error ?? null,
                logoutMutation,
                fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
