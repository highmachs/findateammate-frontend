import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

if (process.env.NODE_ENV !== "production") {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        dotenv.config({ path: path.resolve(__dirname, "../.env") });
    } catch (e) {
        // Fallback for environments where import.meta.url might fail or other issues
        console.warn("Could not load local .env file:", e);
    }
}
