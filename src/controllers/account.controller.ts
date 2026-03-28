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

export const getUserAccountsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const accounts = await accountModel.find({
      user: (req as any).user._id,
    });

    res.status(200).json({ accounts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

export const getAccountBalanceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const accountId = req.params.accountId;

    console.log("accountId", accountId);
    const account = await accountModel.findById(accountId);

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const balance = await account.getBalance();

    res.status(200).json({ balance });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch balance",
    });
  }
};

export default createAccount;
