/**
 * Simple Analytics Collector for FindATeammate
 * Built by Antigravity for AhiLight
 */

export const trackEvent = async (event: string, metadata: Record<string, any> = {}) => {
    try {
        const payload = {
            event,
            page: window.location.pathname,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
            }
        };

        // Fire and forget - don't await so we don't block the UI
        const body = JSON.stringify(payload);
        // NOTE: sendBeacon cannot send custom headers, so /api/analytics is CSRF-exempt on the backend.
        // The backend silently drops events from unauthenticated users (returns 204), so no 401 spam.
        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: "application/json" });
            navigator.sendBeacon("/api/analytics", blob);
        } else {
            fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                keepalive: true,
            }).catch(() => {
                // Silently swallow - analytics failures must never trigger error logging (causes loops)
            });
        }

    } catch {
        // Silently swallow - analytics failures must never crash the app or trigger error logging
    }
};

// Hook for page views
export const trackPageView = () => {
    trackEvent("page_view");
};
