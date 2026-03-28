import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import userModel from "../models/user.model";

interface CustomRequest extends Request {
  user?: any;
}

const getToken = (req: Request): string | undefined => {
  return (
    req.cookies?.token ||
    req.headers.authorization?.split(" ")[1]
  );
};

const verifyToken = (token: string): JwtPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
};

export const authMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = getToken(req);

  if (!token) {
    res.status(401).json({ message: "Token missing" });
    return;
  }

  try {
    const decoded = verifyToken(token);
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const authSystemUserMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = getToken(req);

  if (!token) {
    res.status(401).json({ message: "Token missing" });
    return;
  }

  try {
    const decoded = verifyToken(token);

    const user = await userModel
      .findById(decoded.userId)
      .select("+systemUser");

    if (!user || !user.systemUser) {
      res.status(403).json({ message: "Not a system user" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("authSystemUserMiddleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};