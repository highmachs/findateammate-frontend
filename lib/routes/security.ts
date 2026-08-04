import { Router } from "express";
import { generateCsrfToken } from "../middleware";

export const securityRouter = Router();

securityRouter.get("/csrf-token", (req: any, res: any) => {
  const token = generateCsrfToken(req, res, true);
  res.status(200).json({ csrfToken: token });
});
