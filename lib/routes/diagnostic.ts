import { Router } from "express";
import { waitUntil } from "@vercel/functions";
import { db } from "../db";
import { users } from "../../shared/schema.sqlite";
import { eq } from "drizzle-orm";
import { logger } from "../logger";

export const diagnosticRouter = Router();

diagnosticRouter.get("/test-waituntil", async (req, res) => {
  // This endpoint returns 200 OK immediately, but queues a background task
  // to verify if Fluid Compute / waitUntil is actually working.
  
  waitUntil(
    (async () => {
      try {
        // Wait 3 seconds (well after the HTTP response is sent)
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        // Write a marker row to the database (or just do a select query)
        const start = Date.now();
        await db.select().from(users).limit(1);
        const duration = Date.now() - start;
        
        logger.info(`WaitUntil Diagnostic Success: DB queried in ${duration}ms AFTER response was sent.`);
      } catch (err) {
        logger.error("WaitUntil Diagnostic Error", err);
      }
    })()
  );

  res.status(200).json({ 
    message: "Response sent. Check Vercel logs in 4 seconds to see if the background task completed.",
    timestamp: new Date().toISOString()
  });
});
