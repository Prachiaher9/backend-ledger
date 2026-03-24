import { Request, Response } from "express";
import transactionModel from "../models/transaction.model";
import ledgerModel from "../models/ledger.model";
import accountModel from "../models/account.model";
import emailService from "../services/email.service";

const createTransaction = async (req: Request, res: Response) => {
  try {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        message: "fromAccount, toAccount, amount, idempotencyKey are required",
      });
    }

    const fromUserAccount = await accountModel.findById(fromAccount);
    const toUserAccount = await accountModel.findById(toAccount);

    if (!fromUserAccount || !toUserAccount) {
      return res.status(400).json({
        message: "Invalid fromAccount or toAccount",
      });
    }
    return res.status(200).json({
      message: "Validation passed (logic not complete)",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default createTransaction;