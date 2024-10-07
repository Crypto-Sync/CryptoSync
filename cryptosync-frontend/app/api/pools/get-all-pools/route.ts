import { NextResponse } from "next/server"; // Import NextResponse from next/server
import dbConnect from "@/lib/dbConnect"; // Import the database connection function
import Pool from "@/models/Pool"; // Import the Pool model

export async function GET() {
  await dbConnect(); // Connect to the database

  try {
    // Fetch all pools from the database
    const pools = await Pool.find().populate("userWalletAddress"); // Populate user data if necessary

    // If no pools are found, return a message
    if (pools.length === 0) {
      return NextResponse.json({ message: "No pools found" }, { status: 404 });
    }

    // Return the list of pools
    return NextResponse.json(pools, { status: 200 });
  } catch (error) {
    console.error("Error fetching pools:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Error fetching pools", error: (error as Error).message },
      { status: 500 }
    );
  }
}
