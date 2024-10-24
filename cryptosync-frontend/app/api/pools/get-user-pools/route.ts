import { NextResponse } from "next/server"; // Import NextResponse from next/server
import dbConnect from "@/lib/dbConnect"; // Import the database connection function
import Pool from "@/models/Pool"; // Import the Pool model
export const revalidate=0;
export async function GET(req: Request) {
  await dbConnect(); // Connect to the database

  const { searchParams } = new URL(req.url); // Get search parameters from the request URL
  const userWalletAddress = searchParams.get("userWalletAddress"); // Extract the userWalletAddress parameter
  console.log("userWalletAddress", userWalletAddress);
  try {
    // If no userWalletAddress is provided, return a message
    if (!userWalletAddress) {
      return NextResponse.json(
        { message: "userWalletAddress parameter is required" },
        { status: 400 }
      );
    }
    // Fetch pools created by the specified user wallet address
    const pools = await Pool.find({ userWalletAddress });

    // If no pools are found, return a message
    if (pools.length === 0) {
      return NextResponse.json(
        { message: "No pools found for this wallet address" },
        { status: 404 }
      );
    }

    // Return the list of pools created by the user
    return NextResponse.json(pools, { status: 200 });
  } catch (error) {
    console.error("Error fetching pools:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Error fetching pools", error: (error as Error).message },
      { status: 500 }
    );
  }
}
