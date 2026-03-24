import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";

const transactionRoutes = Router();

/**
 * - POST /api/transaction/
 * - Create a transaction
 */
transactionRoutes.post("/", authMiddleware);

export default transactionRoutes;