import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./User";
import { IPool } from "./Pool";

export interface ITransaction extends Document {
  type:
    | "rebalance"
    | "take-profit"
    | "stop-loss"
    | "deposit"
    | "withdraw"
    | "modify-pool";
  txDate: Date;
  txHash: string;
  description: string;
  tokenBefore: Record<string, number>;
  tokenAfter: Record<string, number>;
  amount: number;
  user: IUser["userWalletAddress"];
  pool: IPool["poolAddress"];
}

const transactionSchema: Schema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
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
  tokenBefore: {
    type: Map,
    of: Number,
  },
  tokenAfter: {
    type: Map,
    of: Number,
  },
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

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);
export default Transaction;
