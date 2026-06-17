import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to detect when a new app version is deployed and notify user
 * Checks for updates every 60 seconds
 * Shows a toast notification when an update is detected
 */
export function useUpdateDetection() {
  const { toast } = useToast();

  useEffect(() => {
    // Get initial version from build time
    const getAppVersion = async () => {
      try {
        // Fetch with cache-busting query param to always get fresh version
        const response = await fetch('/index.html?t=' + Date.now());
        const html = await response.text();
        
        // Extract version from HTML meta tag or build timestamp
        // The build system should inject this
        const versionMatch = html.match(/data-app-version="([^"]+)"/);
        return versionMatch ? versionMatch[1] : null;
      } catch (error) {
        console.error('Failed to fetch app version:', error);
        return null;
      }
    };

    const checkForUpdates = async () => {
      const currentVersion = localStorage.getItem('app_version');
      const newVersion = await getAppVersion();

      if (!currentVersion) {
        // First load - store the version
        if (newVersion) {
          localStorage.setItem('app_version', newVersion);
        }
        return;
      }

      // Version mismatch - app has been updated!
      if (newVersion && currentVersion !== newVersion) {
        console.log(`App updated from ${currentVersion} to ${newVersion}`);
        
        toast({
          title: "✨ New Version Available",
          description: "A fresh update is ready. Click to reload and get the latest features!",
          variant: "default",
          duration: 0, // Don't auto-dismiss
          action: {
            label: "Refresh",
            onClick: () => {
              // Hard refresh - clears cache and reloads
              window.location.href = window.location.href;
            },
          } as any, // Allow custom onClick handler
        });

        // Update stored version
        localStorage.setItem('app_version', newVersion);
      }
    };

    // Check immediately on mount
    checkForUpdates();

    // Then check every 60 seconds
    const interval = setInterval(checkForUpdates, 60000);

    return () => clearInterval(interval);
  }, [toast]);
}
