import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";

const enableSpeedInsights =
    import.meta.env.PROD && import.meta.env.VITE_ENABLE_SPEED_INSIGHTS === "true";

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <App />
        {enableSpeedInsights ? <SpeedInsights /> : null}
        <CookieConsent />
    </ErrorBoundary>
);
