import { useEffect } from "react";
import { useLocation } from "wouter";
import { logEvent } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export function useAnalytics() {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Log page view on route change
    logEvent({
      event: "page_view",
      page: location,
      metadata: { 
        userId: user?.id,
        timestamp: new Date().toISOString()
      }
    });

  }, [location, user?.id]);
}
