import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./User";
import { IPool } from "./Pool";

export interface ITransaction extends Document {
  type:
  | "no-action"
  | "rebalance"
  | "take-profit"
  | "stop-loss"
  | "deposit"
  | "withdraw"
  | "modify-pool";
  txDate: Date;
  txHash: string;
  description: string;
  tokenBefore: { tokenName: string, tokenPercentage: number }[];
  tokenAfter: { tokenName: string, tokenPercentage: number }[];
  amount: number;
  user: IUser["userWalletAddress"];
  pool: IPool["poolAddress"];
}

const transactionSchema: Schema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "no-action",
      "rebalance",
      "take-profit",
      "stop-loss",
      "deposit",
      "withdraw",
      "modify-pool",
    ],
    required: true,
  },
  txDate: {
    type: Date,
    default: Date.now,
  },
  txHash: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  tokenBefore: [{
    tokenName: { type: String, required: true },
    tokenPercentage: { type: Number, required: true }
  }],
  tokenAfter: [{
    tokenName: { type: String, required: true },
    tokenPercentage: { type: Number, required: true }
  }],
  amount: {
    type: Number,
    default: 0,
  },
  user: {
    type: String,
    ref: "User",
    required: true,
  },
  pool: {
    type: String,
    ref: "Pool",
    required: true,
  },

});

// Check if the model is already compiled, and if not, compile it
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", transactionSchema);

export default Transaction;
