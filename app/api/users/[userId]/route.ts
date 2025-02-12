import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { userId } = params;

    // Validate userId
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete the user
    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params: { userId } }: { params: { userId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const updates = await request.json();

    // If role is being updated to Administrator, set all permissions to true
    if (updates.role === "Administrator" || updates.role === "admin") {
      updates.role = "Administrator";
      updates.permissions = {
        dashboard: true,
        leads: true,
        calendar: true,
        email: true,
        settings: true,
        inventory: true,
        favorites: true,
        mls: true
      };
    }

    // If permissions are being updated, ensure all fields are present
    if (updates.permissions) {
      const currentUser = await db.collection("users").findOne({
        _id: new ObjectId(userId)
      });

      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Merge existing permissions with updates
      updates.permissions = {
        ...currentUser.permissions,
        ...updates.permissions,
        // Explicitly handle MLS permission
        mls: updates.permissions.mls ?? currentUser.permissions?.mls ?? false
      };

      // If user is Administrator, ensure all permissions are true
      if (updates.role === "Administrator" || currentUser.role === "Administrator") {
        Object.keys(updates.permissions).forEach(key => {
          updates.permissions[key] = true;
        });
      }
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
} 