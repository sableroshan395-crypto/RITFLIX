import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Media from "@/models/Media";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // Movie, Series, Anime
    const isFeatured = searchParams.get("isFeatured");

    let query = {};
    if (type) query.type = type;
    if (isFeatured) query.isFeatured = true;

    const mediaList = await Media.find(query).sort({ createdAt: -1 });
    return NextResponse.json(mediaList);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // TEMPORARY: Bypassing auth check for development/testing
    /*
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */

    await dbConnect();
    const body = await request.json();
    
    const newMedia = await Media.create(body);
    return NextResponse.json(newMedia, { status: 201 });
  } catch (error) {
    console.error("API POST Media Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create media" }, { status: 500 });
  }
}
