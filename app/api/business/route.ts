import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BusinessProfile from "@/models/BusinessProfile";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Fetch the most recently updated profile, or just the first one
    const profile = await BusinessProfile.findOne().sort({ updatedAt: -1 });
    
    if (!profile) {
      return NextResponse.json(null);
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    
    // Check if a profile exists
    const existing = await BusinessProfile.findOne();
    
    let profile;
    if (existing) {
        // Update existing
        profile = await BusinessProfile.findByIdAndUpdate(existing._id, { 
            ...data,
            updatedAt: new Date() 
        }, { new: true });
    } else {
        // Create new
        profile = await BusinessProfile.create(data);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error saving business profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
