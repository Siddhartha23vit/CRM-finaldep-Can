import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Fetch all leads that have showings
    const leads = await db.collection("leads").find(
      { showings: { $exists: true } }
    ).project({
      name: 1,
      showings: 1
    }).toArray()

    // Transform the data to include lead information with each showing
    const allShowings = leads.flatMap(lead => 
      lead.showings.map((showing: any) => ({
        ...showing,
        leadName: lead.name,
        leadId: lead._id.toString()
      }))
    )

    return NextResponse.json(allShowings)
  } catch (error) {
    console.error("Fetch showings error:", error)
    return NextResponse.json(
      { error: "Failed to fetch showings" },
      { status: 500 }
    )
  }
} 