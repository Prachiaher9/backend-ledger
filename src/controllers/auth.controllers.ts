import { Request, Response } from "express";
import userModel from "../models/user.model";
import jwt from "jsonwebtoken";

/**
 *
 * - user register controller
 * - POST /api/auth/register
 */

export const userRegisterController = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({
      email: email,
    });

    if (isExists) {
      return res.status(422).json({
        message: "User already exists with email",
        status: "failed",
      });
    }

    const user = await userModel.create({
      email,
      password,
      name,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: "3d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};
