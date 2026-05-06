import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Media from "@/models/Media";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // For development/placeholder handling
    if (id === "placeholder") {
      return NextResponse.json({
        _id: "placeholder",
        title: "Demon Slayer: Kimetsu no Yaiba",
        description: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.",
        type: "Anime",
        genre: "Action",
        videoSource: "https://www.w3schools.com/html/mov_bbb.mp4", // Big Buck Bunny as placeholder
      });
    }

    const media = await Media.findById(id);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    
    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedMedia = await Media.findByIdAndDelete(id);
    if (!deletedMedia) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Media deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("API DELETE Media Error:", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await request.json();

    const updatedMedia = await Media.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedMedia) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMedia, { status: 200 });
  } catch (error) {
    console.error("API PUT Media Error:", error);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}
