import { Router } from "express";
import { userRegisterController, userLoginController} from "../controllers/auth.controllers";

const router = Router();

/* POST /api/auth/register */
router.post("/register", userRegisterController);

/* POST /api/auth/login */

router.post("/login", userLoginController);

export default router;