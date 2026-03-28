import { Request, Response } from "express";
import userModel from "../models/user.model";
import jwt from "jsonwebtoken";
import emailService from "../services/email.service"
import TokenBlacklistModel from "../models/blackList.model";


/**
 * - user register controller
 * - POST /api/auth/register
 */
export const userRegisterController = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({ email });

    if (isExists) {
      return res.status(422).json({
        message: "User already exists with email",
        status: "failed",
      });
    }

    const user = await userModel.create({ email, password, name });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: { _id: user._id, email: user.email, name: user.name },
      token,
    });

    console.log(user.email, user.name,"23456789")
    await emailService.sendRegistrationEmail(user.email, user.name)
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Error creating user" });
  }
};

/**
 * - user login controller
 * - POST /api/auth/login
 */
export const userLoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Email or password is INVALID" });
    }

    const isValidPassword = await (user as any).comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Email or password is INVALID" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: { _id: user._id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
};



export const userLogoutController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(200).json({
        message: "User logged out successfully",
      });
      return;
    }

    await TokenBlacklistModel.create({
      token,
    });

    res.clearCookie("token");

    res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong during logout",
    });
  }
};