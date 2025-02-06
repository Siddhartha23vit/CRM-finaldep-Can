// This file can be deleted as we're consolidating tasks into the new system

import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { tasks, notes } = await request.json()

    const result = await db.collection("leads").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          strategy: {
            lastUpdated: new Date(),
            tasks: tasks,
            notes: notes,
          },
        },
      },
      { returnDocument: "after" },
    )

    if (!result.value) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(result.value.strategy)
  } catch (error) {
    console.error("Update strategy error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const lead = await db.collection("leads").findOne({ _id: new ObjectId(params.id) })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(lead.strategy || {})
  } catch (error) {
    console.error("Fetch strategy error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

