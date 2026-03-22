import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        message: "Unauthorized access, user not found",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
};

export default authMiddleware;
