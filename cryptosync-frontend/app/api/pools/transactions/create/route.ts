import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Transaction, { ITransaction } from "@/models/Transaction";
import User from "@/models/User";
import Pool from "@/models/Pool";

interface TransactionRequestBody {
  type:
    | "rebalance"
    | "take-profit"
    | "stop-loss"
    | "deposit"
    | "withdraw"
    | "modify-pool";
  txHash: string;
  description?: string;
  tokenBefore: Record<string, number>;
  tokenAfter: Record<string, number>;
  amount: number;
  userId: string;
  poolId: string;
}

export async function POST(req: Request) {
  await dbConnect();

  try {
    const {
      type,
      txHash,
      description = "",
      tokenBefore,
      tokenAfter,
      userId,
      poolId,
      amount,
    }: TransactionRequestBody = await req.json();

    // Validate required fields
    if (!type || !txHash || !userId || !poolId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verify if the pool exists
    const pool = await Pool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ message: "Pool not found" }, { status: 404 });
    }

    // Create a new transaction
    const transaction: ITransaction = new Transaction({
      type,
      txHash,
      description,
      tokenBefore,
      tokenAfter,
      amount,
      user: userId,
      pool: poolId,
    });

    await transaction.save();

    // Return success response
    return NextResponse.json(
      { message: "Transaction stored successfully", transaction },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error storing transaction:", error);
    return NextResponse.json(
      { message: "Error storing transaction", error: (error as Error).message },
      { status: 500 }
    );
  }
}
