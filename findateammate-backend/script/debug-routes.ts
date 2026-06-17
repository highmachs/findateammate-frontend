
import { app } from "../backend/index";
// import { registerRoutes } from "../backend/routes";
// import { createServer } from "http";

async function debug() {
    console.log("Debugging Routes...");
    // const server = createServer(app);
    // registerRoutes is already called in index.ts immediately executed function?
    // index.ts has an IIFE that likely runs on import?
    // Let's check if we can inspect app._router directly.
    
    // Wait for a moment in case index.ts IIFE is running
    setTimeout(() => {
        const routes: any[] = [];
        if (app._router) {
            app._router.stack.forEach((middleware: any) => {
                if (middleware.route) {
                    routes.push(middleware.route);
                } else if (middleware.name === 'router') {
                    middleware.handle.stack.forEach((handler: any) => {
                        if (handler.route) routes.push(handler.route);
                    });
                }
            });
        }
        
        const googleRoute = routes.find((r: any) => r.path === '/api/auth/google');
        if (googleRoute) {
            console.log("✅ FOUND: /api/auth/google");
            console.log(googleRoute);
        } else {
            console.log("❌ NOT FOUND: /api/auth/google");
            console.log("Available routes:", routes.map(r => r.path));
        }
        process.exit(0);
    }, 2000);
}

debug().catch(console.error);
