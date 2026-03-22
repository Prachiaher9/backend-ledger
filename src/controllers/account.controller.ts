import { Request, Response } from "express";
import accountModel from "../models/account.model";

const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await accountModel.create({
      user: req.user._id,
    });

    res.status(201).json({
      account,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default createAccount;