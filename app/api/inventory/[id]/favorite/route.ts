import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params
    const { isFavorite } = await request.json()

    // Validate ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid item ID" },
        { status: 400 }
      )
    }

    // Check if item exists
    const item = await db.collection("inventory").findOne({
      _id: new ObjectId(id),
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // Update the favorite status
    const result = await db.collection("inventory").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isFavorite, lastUpdated: new Date().toISOString() } }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update favorite status" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating favorite status:", error)
    return NextResponse.json(
      { error: "Failed to update favorite status" },
      { status: 500 }
    )
  }
} 