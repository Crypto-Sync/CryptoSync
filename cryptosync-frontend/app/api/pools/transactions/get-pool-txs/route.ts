import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Transaction, { ITransaction } from "@/models/Transaction";

export async function GET(req: Request) {
  await dbConnect();

  try {
    // Parse the URL to get the poolId
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    if (!poolId) {
      return NextResponse.json({ message: "Missing pool ID" }, { status: 400 });
    }

    // Fetch all transactions related to the specified poolId
    const transactions: ITransaction[] = await Transaction.find({
      pool: poolId,
    })
      // .populate("user", "userWalletAddress")
      // .exec();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { message: "No transactions found for this pool" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Transactions retrieved successfully", transactions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        message: "Error fetching transactions",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
