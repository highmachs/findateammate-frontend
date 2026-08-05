import serverless from "serverless-http";
import { app, registerRoutes } from "../lib/routes";

// Initialize the Express routes once per cold start
registerRoutes();

// Delegate to the Express app via serverless-http adapter
export default serverless(app, { binary: [] });
