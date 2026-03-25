import { Request, Response } from "express";
import transactionModel from "../models/transaction.model";
import ledgerModel from "../models/ledger.model";
import accountModel from "../models/account.model";
import emailService from "../services/email.service";
import mongoose from "mongoose";

/**
 * Create a new transaction
 *
 * THE 10-STEP TRANSFER FLOW:
 *
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

const createTransaction = async (req: Request, res: Response) => {
  try {
    /**
     * 1 - Validate user inputs
     */
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

    /**
     * 2.Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
      idemPotencyKey: idempotencyKey,
    });

    if (isTransactionAlreadyExists) {
      if (isTransactionAlreadyExists.status === "COMPLETED") {
        return res.status(200).json({
          message: "Transaction already processed",
          transaction: isTransactionAlreadyExists,
        });
      }
      if (isTransactionAlreadyExists.status === "PENDING") {
        return res.status(200).json({
          message: "Transaction is still processing",
        });
      }
      if (isTransactionAlreadyExists.status === "FAILED") {
        return res.status(500).json({
          message: "Transaction processing failed,please retry ",
        });
      }
      if (isTransactionAlreadyExists.status === "REVERSED") {
        return res.status(500).json({
          message: "Transaction processing reversed,please retry ",
        });
      }
    }

    /**
     * 3.check account status
     */
    if (
      fromUserAccount.status !== "ACTIVE" ||
      toUserAccount.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        message:
          "Both fromAccount and toAccount must be ACTIVE to process transaction",
      });
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    /**
     * 5.Create transaction (PENDING)
     */
    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transactionModel.create({
      fromAccount,
      toAccount,
      amount,
      idemPotencyKey,
      status:"PENDING"
    },{session})

    const debitLedgerEntry = await ledgerModel.create({
      account : fromAccount,
      amount : amount,
      transaction : transaction._id,
      type:"DEBIT"
    },{session})


    const creditLedgerEntry = await ledgerModel.create({
      account : toAccount,
      amount : amount,
      transaction : transaction._id,
      type:"CREDIT"
    },{session})

    transaction.status = "COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    /**
     * 10.Send email notification
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name,amount,toAccount)

    return res.status(201).json({
      message:"Transaction completed successfully",
      transaction:transaction
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



export default createTransaction;
