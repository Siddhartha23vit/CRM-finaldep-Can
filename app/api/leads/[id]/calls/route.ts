import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const lead = await db.collection("leads").findOne({ _id: new ObjectId(params.id) })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(lead.callHistory || [])
  } catch (error) {
    console.error("Fetch call history error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

