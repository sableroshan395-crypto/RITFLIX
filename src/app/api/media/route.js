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
    const isMCU = searchParams.get("isMCU");
    const phase = searchParams.get("phase");
    const saga = searchParams.get("saga");
    const sortBy = searchParams.get("sortBy"); // chronologicalOrder, releaseOrder, createdAt

    let query = {};
    if (type) query.type = type;
    if (isFeatured === "true") query.isFeatured = true;
    if (isMCU === "true") query.isMCU = true;
    if (isMCU === "false") query.isMCU = { $ne: true };
    if (phase) query.mcuPhase = phase;
    if (saga && saga !== "All") {
      if (saga === "Infinity Saga" || saga === "The Infinity Saga") {
        query.mcuSaga = { $in: ["Infinity Saga", "The Infinity Saga"] };
      } else if (saga === "Multiverse Saga" || saga === "The Multiverse Saga") {
        query.mcuSaga = { $in: ["Multiverse Saga", "The Multiverse Saga"] };
      } else {
        query.mcuSaga = saga;
      }
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "chronologicalOrder") {
      sortOptions = { chronologicalOrder: 1, createdAt: -1 };
    } else if (sortBy === "releaseOrder") {
      sortOptions = { releaseOrder: 1, createdAt: -1 };
    }

    const mediaList = await Media.find(query).sort(sortOptions);
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
