import { Router } from "express";
import { generateCsrfToken } from "../middleware";

export const securityRouter = Router();

securityRouter.get("/csrf-token", (req: any, res: any) => {
  console.log("csrf-token-----start")
  const token = generateCsrfToken(req, res, true);
  console.log("csrf-token-----end")
  res.status(200).json({ csrfToken: token });
});
