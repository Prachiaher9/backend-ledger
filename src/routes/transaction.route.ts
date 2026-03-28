import { Router } from "express";
import {authMiddleware} from "../middleware/auth.middleware";
import {createTransaction,createInitialFundsTransaction} from "../controllers/transaction.controller";

const transactionRoutes = Router();

/**
 * - POST /api/transaction/
 * - Create a transaction
 */
transactionRoutes.post("/", authMiddleware,createTransaction);

/**
 * - POST /api/transaction/system/initial-funds
 * - Create initial funds transacton from system user
 */

transactionRoutes.post("/system/initial-funds", authMiddleware,createInitialFundsTransaction)


export default transactionRoutes;