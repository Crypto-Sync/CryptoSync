import dbConnect from "@/lib/dbConnect";
import Pool, { IPool } from "@/models/Pool";
import User, { IUser } from "@/models/User";

interface CreatePoolRequest extends Request {
  userWalletAddress: string;
  poolName: string;
  poolAddress: string;
  totalValue: number;
  tokens: Array<{
    symbol: string;
    amount: number;
    proportion: number;
    takeProfitPercentage: number;
    stopLossAtTokenPrice: number;
  }>;
  rebalancingThreshold: number;
  rebalancingFrequency: string;
}

export async function POST(req: CreatePoolRequest) {
  await dbConnect();
  // console.log(dbConnection);

  try {
    const {
      userWalletAddress,
      poolName,
      poolAddress,
      totalValue,
      tokens,
      rebalancingThreshold,
      rebalancingFrequency,
    } = await req.json(); // Parse the JSON body

    // Validate required fields
    if (
      !userWalletAddress ||
      !poolName ||
      !poolAddress ||
      !totalValue ||
      !tokens ||
      !rebalancingThreshold ||
      !rebalancingFrequency
    ) {
      return Response.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log({
      userWalletAddress,
      poolName,
      poolAddress,
      totalValue,
      tokens,
      rebalancingThreshold,
      rebalancingFrequency,
    });
    // Check if user exists, if not create a new user
    let user: IUser | null = await User.findOne({
      userWalletAddress: userWalletAddress,
    });
    if (!user) {
      user = new User({ userWalletAddress });
      console.log("user", user);
      console.log("inside adding user");
      await user.save();
    }

    const pool: IPool = new Pool({
      userWalletAddress,
      poolName,
      poolAddress,
      totalValue,
      tokens,
      rebalancingThreshold,
      rebalancingFrequency,
    });

    await pool.save();

    return Response.json("Pool Created Successfully", { status: 201 });
    // res.status(201).json();
  } catch (error) {
    return Response.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
