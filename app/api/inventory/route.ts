import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get all inventory items
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const items = await db.collection("inventory").find({}).toArray()
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    )
  }
}

// Create a new inventory item
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()

    // Add timestamps
    const now = new Date().toISOString()
    const item = {
      ...data,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now
    }

    const result = await db.collection("inventory").insertOne(item)

    if (!result.insertedId) {
      throw new Error("Failed to create item")
    }

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        _id: result.insertedId
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    )
  }
}

// Update an inventory item
export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid item ID" },
        { status: 400 }
      )
    }

    // Add timestamps
    const now = new Date().toISOString()
    updateData.updatedAt = now
    updateData.lastUpdated = now

    const result = await db.collection("inventory").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes were made to the item" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Item updated successfully"
    })
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    )
  }
} 