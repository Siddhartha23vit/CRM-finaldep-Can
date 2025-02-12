import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from 'bcryptjs';

const defaultPermissions = {
  dashboard: false,
  leads: false,
  calendar: false,
  email: false,
  settings: false,
  inventory: false,
  favorites: false,
  mls: false
};

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection("users").find({}).toArray();
    
    // Ensure each user has permissions and remove password from response
    const usersWithPermissions = users.map(user => ({
      ...user,
      permissions: user.permissions || defaultPermissions,
      password: undefined // Remove password from response
    }));
    
    return NextResponse.json(usersWithPermissions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const userData = await request.json();

    // Validate required fields
    if (!userData.email || !userData.password || !userData.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({
      email: { $regex: new RegExp(`^${userData.email}$`, 'i') }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Ensure role is set and normalize it
    if (!userData.role) {
      userData.role = "User";
    }

    // Normalize role to proper case
    userData.role = userData.role.toLowerCase();
    if (userData.role === "admin" || userData.role === "administrator" || userData.role === "Administrator") {
      userData.role = "Administrator";
      // Set admin permissions - always full permissions for admin
      userData.permissions = {
        dashboard: true,
        leads: true,
        calendar: true,
        email: true,
        settings: true,
        inventory: true,
        favorites: true,
        mls: true
      };
      console.log("Setting admin role and permissions:", { role: userData.role, permissions: userData.permissions });
    } else {
      userData.role = userData.role.charAt(0).toUpperCase() + userData.role.slice(1); // Capitalize first letter
      // Use provided permissions or default for non-admin users
      userData.permissions = {
        dashboard: userData.permissions?.dashboard ?? defaultPermissions.dashboard,
        leads: userData.permissions?.leads ?? defaultPermissions.leads,
        calendar: userData.permissions?.calendar ?? defaultPermissions.calendar,
        email: userData.permissions?.email ?? defaultPermissions.email,
        settings: userData.permissions?.settings ?? defaultPermissions.settings,
        inventory: userData.permissions?.inventory ?? defaultPermissions.inventory,
        favorites: userData.permissions?.favorites ?? defaultPermissions.favorites,
        mls: userData.permissions?.mls ?? defaultPermissions.mls
      };
      console.log("Setting non-admin role and permissions:", { role: userData.role, permissions: userData.permissions });
    }

    // Ensure status is set
    userData.status = userData.status || "active";

    // Add timestamps
    userData.createdAt = new Date().toISOString();
    userData.updatedAt = new Date().toISOString();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    console.log("Creating user:", { ...userData, password: '[HIDDEN]' }); // Debug log

    const result = await db.collection("users").insertOne(userData);

    if (!result.insertedId) {
      throw new Error("Failed to create user");
    }

    // Return created user without password
    const { password, ...userWithoutPassword } = userData;
    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { id, ...updateData } = await request.json();

    // Validate user exists
    const existingUser = await db.collection("users").findOne({
      _id: new ObjectId(id)
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If password is provided, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      // Remove password field if not provided to keep existing password
      delete updateData.password;
    }

    // Update timestamp
    updateData.updatedAt = new Date().toISOString();

    // Handle role changes and permissions
    if (updateData.role) {
      // Normalize role to proper case
      updateData.role = updateData.role.toLowerCase();
      console.log("Role update requested:", { newRole: updateData.role });
      
      if (updateData.role === "admin" || updateData.role === "administrator") {
        updateData.role = "Administrator";
        // Set admin permissions - always full permissions for admin
        updateData.permissions = {
          dashboard: true,
          leads: true,
          calendar: true,
          email: true,
          settings: true,
          inventory: true,
          favorites: true,
          mls: true
        };
        console.log("Updated to admin role:", { role: updateData.role, permissions: updateData.permissions });
      } else {
        updateData.role = updateData.role.charAt(0).toUpperCase() + updateData.role.slice(1); // Capitalize first letter
        // Keep existing permissions if not explicitly provided in update
        if (updateData.permissions) {
          updateData.permissions = {
            dashboard: updateData.permissions.dashboard ?? existingUser.permissions?.dashboard ?? defaultPermissions.dashboard,
            leads: updateData.permissions.leads ?? existingUser.permissions?.leads ?? defaultPermissions.leads,
            calendar: updateData.permissions.calendar ?? existingUser.permissions?.calendar ?? defaultPermissions.calendar,
            email: updateData.permissions.email ?? existingUser.permissions?.email ?? defaultPermissions.email,
            settings: updateData.permissions.settings ?? existingUser.permissions?.settings ?? defaultPermissions.settings,
            inventory: updateData.permissions.inventory ?? existingUser.permissions?.inventory ?? defaultPermissions.inventory,
            favorites: updateData.permissions.favorites ?? existingUser.permissions?.favorites ?? defaultPermissions.favorites,
            mls: updateData.permissions.mls ?? existingUser.permissions?.mls ?? defaultPermissions.mls
          };
        }
      }
    } else if (updateData.permissions) {
      // Handle permission updates without role change
      updateData.permissions = {
        dashboard: updateData.permissions.dashboard ?? existingUser.permissions?.dashboard ?? defaultPermissions.dashboard,
        leads: updateData.permissions.leads ?? existingUser.permissions?.leads ?? defaultPermissions.leads,
        calendar: updateData.permissions.calendar ?? existingUser.permissions?.calendar ?? defaultPermissions.calendar,
        email: updateData.permissions.email ?? existingUser.permissions?.email ?? defaultPermissions.email,
        settings: updateData.permissions.settings ?? existingUser.permissions?.settings ?? defaultPermissions.settings,
        inventory: updateData.permissions.inventory ?? existingUser.permissions?.inventory ?? defaultPermissions.inventory,
        favorites: updateData.permissions.favorites ?? existingUser.permissions?.favorites ?? defaultPermissions.favorites,
        mls: updateData.permissions.mls ?? existingUser.permissions?.mls ?? defaultPermissions.mls
      };
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Return updated user without password
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
} 