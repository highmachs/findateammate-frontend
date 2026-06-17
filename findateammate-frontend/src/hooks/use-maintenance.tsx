import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";
import { getMaintenanceStatus } from "@/lib/api";

type MaintenanceStatus = {
  enabled: boolean;
  mode: "OFF" | "PARTIAL" | "FULL";
  message?: string;
  eta?: string;
};

type MaintenanceContextType = {
  status: MaintenanceStatus;
  isLoading: boolean;
  checkStatus: () => Promise<void>;
};

const MaintenanceContext = createContext<MaintenanceContextType | null>(null);

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, isLoading: authIsLoading } = useAuth(); // To allow admin bypass
  
  const { data: status, refetch, isLoading: maintenanceIsLoading } = useQuery<MaintenanceStatus>({
    queryKey: ["maintenance"],
    queryFn: getMaintenanceStatus,
    refetchInterval: 60000, // Poll every minute as backup
    staleTime: 30000,
  });

  const currentStatus = status || { enabled: false, mode: "OFF" };

  useEffect(() => {
    const handle503 = () => {
        refetch();
    };
    window.addEventListener("maintenance_503", handle503);
    return () => window.removeEventListener("maintenance_503", handle503);
  }, [refetch]);

  useEffect(() => {
    // BUG FIX: Wait for BOTH maintenance AND auth queries to finish loading.
    // Previously only maintenanceIsLoading was checked. On page load both queries
    // fire in parallel — maintenance resolves first while auth is still loading,
    // user is null, user?.isAdmin is undefined, and the admin gets redirected
    // to /maintenance even though they have full bypass rights.
    if (maintenanceIsLoading || authIsLoading) return;
    
    // Admin Bypass Logic: Admins are immune to redirects
    if (user?.isAdmin) return;

    if (currentStatus.enabled && currentStatus.mode === "FULL") {
        // Allow Landing Page logic? 
        // Plan said: Landing page & public status endpoints only.
        // So validation: If location is NOT "/" and NOT "/maintenance", redirect.
        if (location !== "/" && location !== "/maintenance") {
            setLocation("/maintenance");
        }
    }
  }, [currentStatus, location, user, maintenanceIsLoading, authIsLoading, setLocation]);

  return (
    <MaintenanceContext.Provider
      value={{
        status: currentStatus,
        isLoading: maintenanceIsLoading,
        checkStatus: async () => { await refetch(); },
      }}
    >
      {children}
      
      {/* Partial Mode Banner: only show after auth is resolved to avoid flash for admins */}
      {currentStatus.enabled && currentStatus.mode === "PARTIAL" && !authIsLoading && !user?.isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-500/90 text-white text-center py-2 px-4 text-sm font-bold z-50 backdrop-blur-sm">
            🚧 System is in Maintenance Mode (Read-Only). Some actions may be unavailable.
        </div>
      )}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
}
