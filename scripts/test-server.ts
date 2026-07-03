import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

process.env.VERCEL = "1";

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    let routePath = url.pathname.replace("/api/", "");
    if (routePath === "" || routePath === "/api") routePath = "index";

    let filePath = path.join(__dirname, "../api", `${routePath}.ts`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, "../api", routePath, "index.ts");
    }

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const moduleUrl = pathToFileURL(filePath).href;
    const module = await import(moduleUrl);
    const handler = module.default;

    if (typeof handler !== "function") {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "No default export" }));
      return;
    }

    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", async () => {
      let parsedBody = {};
      if (body) {
        try { parsedBody = JSON.parse(body); } catch (e) {}
      }

      req.headers["x-forwarded-proto"] = "https";
      const vercelReq = Object.assign(req, {
        query: Object.fromEntries(url.searchParams),
        cookies: {},
        body: parsedBody,
      });

      const vercelRes = Object.assign(res, {
        status: (code: number) => { res.statusCode = code; return vercelRes; },
        json: (jsonBody: any) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(jsonBody));
          return vercelRes;
        },
        send: (textBody: any) => {
          res.end(textBody);
          return vercelRes;
        },
      });

      await handler(vercelReq, vercelRes);
    });
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
});

server.listen(3000, () => {
  console.log("Mock Vercel API running on port 3000");
});
