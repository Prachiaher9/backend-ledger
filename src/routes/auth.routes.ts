import { Router } from "express";
import { userRegisterController } from "../controllers/auth.controllers";

const router = Router();

router.post("/register", userRegisterController);

export default router;