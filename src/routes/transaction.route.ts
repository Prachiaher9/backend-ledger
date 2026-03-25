import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import createTransaction from "../controllers/transaction.controller";

const transactionRoutes = Router();

/**
 * - POST /api/transaction/
 * - Create a transaction
 */
transactionRoutes.post("/", authMiddleware,createTransaction);

export default transactionRoutes;