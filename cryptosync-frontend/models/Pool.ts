import mongoose, { Document, Model } from "mongoose";

interface IToken {
  symbol: string;
  amount: number;
  proportion: number;
  takeProfitPercentage: number;
  stopLossAtTokenPrice: number;
  initialTokenPriceInUSD: number;
}

export interface IPool extends Document {
  userWalletAddress: string;
  poolName: string;
  poolAddress: string;
  totalValue: number;
  tokens: IToken[];
  rebalancingThreshold: number;
  rebalancingFrequency: string;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema = new mongoose.Schema<IToken>({
  symbol: String,
  amount: Number,
  proportion: Number,
  takeProfitPercentage: Number,
  stopLossAtTokenPrice: Number,
  initialTokenPriceInUSD: Number,
});

const PoolSchema = new mongoose.Schema<IPool>({
  userWalletAddress: { type: String, required: true, ref: "User" },
  poolName: { type: String, required: true },
  poolAddress: { type: String, required: true },
  totalValue: { type: Number, required: true },
  tokens: [TokenSchema],
  rebalancingThreshold: { type: Number, required: true },
  rebalancingFrequency: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Pool: Model<IPool> =
  mongoose.models.Pool || mongoose.model<IPool>("Pool", PoolSchema);

export default Pool;
