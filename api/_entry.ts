import { app, registerRoutes } from "../lib/routes";

// Initialize the Express routes once per cold start
registerRoutes();

// Vercel natively supports Express apps directly
export default app;
