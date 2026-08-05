import serverless from "serverless-http";
import express from "express";

const app = express();

app.get("/api/ping", (req, res) => {
  console.log("PING");
  res.json({ ok: true });
});

export default serverless(app, { binary: [] });
