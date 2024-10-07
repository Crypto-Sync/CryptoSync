import mongoose, { Document, Model } from "mongoose";

interface IToken {
  symbol: string;
  amount: number;
  proportion: number;
}

export interface IPool extends Document {
  userWalletAddress: string;
  poolName: string;
  totalValue: number;
  tokens: IToken[];
  rebalancingThreshold: number;
  rebalancingFrequency: string;
  takeProfitPercentage?: number;
  stopLossPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema = new mongoose.Schema<IToken>({
  symbol: String,
  amount: Number,
  proportion: Number,
});

const PoolSchema = new mongoose.Schema<IPool>({
  userWalletAddress: { type: String, required: true, ref: "User" },
  poolName: { type: String, required: true },
  totalValue: { type: Number, required: true },
  tokens: [TokenSchema],
  rebalancingThreshold: { type: Number, required: true },
  rebalancingFrequency: { type: String, required: true },
  takeProfitPercentage: { type: Number, default: null },
  stopLossPercentage: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Pool: Model<IPool> =
  mongoose.models.Pool || mongoose.model<IPool>("Pool", PoolSchema);

export default Pool;
