import express from "express"
import {authMiddleware} from "../middleware/auth.middleware"
import createAccount from "../controllers/account.controller"

const router = express.Router()

/*
// * - POST /api/accounts/
   * - Create a new account
   * - protected route
*/

router.post("/",authMiddleware,createAccount)

export default router