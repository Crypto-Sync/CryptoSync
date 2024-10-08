import { NextResponse } from "next/server"; // Import NextResponse from next/server
import dbConnect from "@/lib/dbConnect"; // Import the database connection function
import Pool from "@/models/Pool"; // Import the Pool model

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url); // Get search parameters from the request URL
  const poolAddress = searchParams.get("poolAddress"); // Extract the userWalletAddress parameter
  console.log("poolAddress", poolAddress);

  await dbConnect(); // Connect to the database

  try {
    // If no userWalletAddress is provided, return a message
    if (!poolAddress) {
      return NextResponse.json(
        { message: "poolAddress parameter is required" },
        { status: 400 }
      );
    }
    // Fetch all pools from the database
    const pool = await Pool.find({ poolAddress }); // Populate user data if necessary

    // If no pools are found, return a message
    if (pool.length === 0) {
      return NextResponse.json({ message: "No pools found" }, { status: 404 });
    }

    // Return the list of pools
    return NextResponse.json(pool, { status: 200 });
  } catch (error) {
    console.error("Error fetching pools:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Error fetching pools", error: (error as Error).message },
      { status: 500 }
    );
  }
}
