import { Request, Response } from "express"
import mongoose, { ClientSession } from "mongoose"

import transactionModel from "../models/transaction.model"
import ledgerModel from "../models/ledger.model"
import accountModel from "../models/account.model"
import emailService from "../services/email.service"

/**
 * Extend Request to include user
 */
interface AuthRequest extends Request {
  user: {
    _id: string
    email: string
    name: string
  }
}

/**
 * Request body types
 */
interface CreateTransactionBody {
  fromAccount: string
  toAccount: string
  amount: number
  idempotencyKey: string
}

interface InitialFundsBody {
  toAccount: string
  amount: number
  idempotencyKey: string
}

/**
 * CREATE TRANSACTION
 */
export async function createTransaction(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const { fromAccount, toAccount, amount, idempotencyKey } =
    req.body as CreateTransactionBody

  console.log("[createTransaction] Step 1 - Received request", {
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
    userId: req.user._id,
  })

  // 1. Validate request
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    console.warn("[createTransaction] Step 1 - Validation failed: missing fields", {
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
    })
    return res.status(400).json({
      message:
        "fromAccount, toAccount, amount and idempotencyKey are required",
    })
  }

  const fromUserAccount = await accountModel.findById(fromAccount)
  const toUserAccount = await accountModel.findById(toAccount)

  console.log("[createTransaction] Step 1 - Account lookup result", {
    fromAccountFound: !!fromUserAccount,
    toAccountFound: !!toUserAccount,
  })

  if (!fromUserAccount || !toUserAccount) {
    console.warn("[createTransaction] Step 1 - Invalid accounts", {
      fromAccount,
      toAccount,
    })
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    })
  }

  // 2. Idempotency check
  console.log("[createTransaction] Step 2 - Checking idempotency key", { idempotencyKey })

  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  })

  if (existingTransaction) {
    console.log("[createTransaction] Step 2 - Duplicate request found", {
      existingTransactionId: existingTransaction._id,
      status: existingTransaction.status,
    })
    switch (existingTransaction.status) {
      case "COMPLETED":
        return res.status(200).json({
          message: "Transaction already processed",
          transaction: existingTransaction,
        })

      case "PENDING":
        return res.status(200).json({
          message: "Transaction is still processing",
        })

      case "FAILED":
      case "REVERSED":
        return res.status(500).json({
          message: "Transaction failed previously, retry",
        })
    }
  }

  // 3. Check account status
  console.log("[createTransaction] Step 3 - Checking account statuses", {
    fromAccountStatus: fromUserAccount.status,
    toAccountStatus: toUserAccount.status,
  })

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    console.warn("[createTransaction] Step 3 - One or both accounts inactive")
    return res.status(400).json({
      message: "Both accounts must be ACTIVE",
    })
  }

  // 4. Check balance
  const balance: number = await fromUserAccount.getBalance()

  console.log("[createTransaction] Step 4 - Balance check", {
    availableBalance: balance,
    requestedAmount: amount,
    sufficient: balance >= amount,
  })

  if (balance < amount) {
    console.warn("[createTransaction] Step 4 - Insufficient balance", {
      availableBalance: balance,
      requestedAmount: amount,
    })
    return res.status(400).json({
      message: `Insufficient balance. Available: ${balance}`,
    })
  }

  let session: ClientSession | null = null

  try {
    session = await mongoose.startSession()
    session.startTransaction()
    console.log("[createTransaction] Step 5 - DB session started")

    // 5. Create transaction
    const [transaction] = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session }
    )

    console.log("[createTransaction] Step 5 - Transaction record created", {
      transactionId: transaction._id,
      status: transaction.status,
    })

    // 6. Debit
    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session }
    )

    console.log("[createTransaction] Step 6 - Debit ledger entry created", {
      account: fromAccount,
      amount,
      transactionId: transaction._id,
    })

    // ⚠️ This artificial delay is BAD practice
    console.warn("[createTransaction] ⚠️ Artificial 15s delay starting — this is bad practice")
    await new Promise((resolve) => setTimeout(resolve, 15000))
    console.log("[createTransaction] ⚠️ Artificial delay ended")

    // 7. Credit
    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }
    )

    console.log("[createTransaction] Step 7 - Credit ledger entry created", {
      account: toAccount,
      amount,
      transactionId: transaction._id,
    })

    // 8. Mark completed
    await transactionModel.findByIdAndUpdate(
      transaction._id,
      { status: "COMPLETED" },
      { session }
    )

    console.log("[createTransaction] Step 8 - Transaction marked COMPLETED", {
      transactionId: transaction._id,
    })

    await session.commitTransaction()
    session.endSession()

    console.log("[createTransaction] Step 9 - DB session committed and closed")

    // 10. Email
    console.log("[createTransaction] Step 10 - Sending email notification", {
      toEmail: req.user.email,
      name: req.user.name,
      amount,
      toAccount,
    })

    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      toAccount
    )

    console.log("[createTransaction] Step 10 - Email sent successfully")

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction,
    })
  } catch (error) {
    console.error("[createTransaction] ❌ Error during transaction", {
      error,
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
    })

    if (session) {
      await session.abortTransaction()
      session.endSession()
      console.log("[createTransaction] DB session aborted and closed")
    }

    return res.status(500).json({
      message: "Transaction failed. Try again.",
      error,
    })
  }
}

/**
 * INITIAL FUNDS TRANSACTION
 */
export async function createInitialFundsTransaction(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const { toAccount, amount, idempotencyKey } =
    req.body as InitialFundsBody

  console.log("[createInitialFundsTransaction] Step 1 - Received request", {
    toAccount,
    amount,
    idempotencyKey,
    userId: req.user._id,
  })

  if (!toAccount || !amount || !idempotencyKey) {
    console.warn("[createInitialFundsTransaction] Step 1 - Validation failed: missing fields")
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required",
    })
  }

  const toUserAccount = await accountModel.findById(toAccount)

  console.log("[createInitialFundsTransaction] Step 1 - toAccount lookup", {
    toAccountFound: !!toUserAccount,
  })

  if (!toUserAccount) {
    console.warn("[createInitialFundsTransaction] Step 1 - toAccount not found", { toAccount })
    return res.status(400).json({
      message: "Invalid toAccount",
    })
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  })

  console.log("[createInitialFundsTransaction] Step 1 - System account lookup", {
    systemAccountFound: !!fromUserAccount,
    userId: req.user._id,
  })

  if (!fromUserAccount) {
    console.warn("[createInitialFundsTransaction] Step 1 - System account not found for user", {
      userId: req.user._id,
    })
    return res.status(400).json({
      message: "System user account not found",
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  console.log("[createInitialFundsTransaction] Step 2 - DB session started")

  try {
    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    })

    console.log("[createInitialFundsTransaction] Step 2 - Transaction object created (not saved yet)", {
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
    })

    await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session }
    )

    console.log("[createInitialFundsTransaction] Step 3 - Debit ledger entry created", {
      account: fromUserAccount._id,
      amount,
    })

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }
    )

    console.log("[createInitialFundsTransaction] Step 4 - Credit ledger entry created", {
      account: toAccount,
      amount,
    })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    console.log("[createInitialFundsTransaction] Step 5 - Transaction saved as COMPLETED", {
      transactionId: transaction._id,
    })

    await session.commitTransaction()
    session.endSession()

    console.log("[createInitialFundsTransaction] Step 6 - DB session committed and closed")

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction,
    })
  } catch (error) {
    console.error("[createInitialFundsTransaction] ❌ Error during initial funds transaction", {
      error,
      toAccount,
      amount,
      idempotencyKey,
    })

    await session.abortTransaction()
    session.endSession()
    console.log("[createInitialFundsTransaction] DB session aborted and closed")

    return res.status(500).json({
      message: "Initial transaction failed",
      error,
    })
  }
}