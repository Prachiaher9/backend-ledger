import express from "express"
import {authMiddleware} from "../middleware/auth.middleware"
import createAccount, { getAccountBalanceController, getUserAccountsController } from "../controllers/account.controller"

const router = express.Router()

/*
// * - POST /api/accounts/
   * - Create a new account
   * - protected route
*/

router.post("/",authMiddleware,createAccount)

/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware, getUserAccountsController)


/**
 * - GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware, getAccountBalanceController)




export default router