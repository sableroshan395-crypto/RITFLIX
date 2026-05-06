import Navbar from "@/components/Navbar";
import MediaCard from "@/components/MediaCard";
import dbConnect from "@/lib/mongodb";
import Media from "@/models/Media";

export const dynamic = "force-dynamic";

async function getAnime() {
  await dbConnect();
  const anime = await Media.find({ type: "Anime" }).sort({ createdAt: -1 }).lean();
  
  return anime.map(item => ({
    ...item,
    _id: item._id.toString(),
    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
  }));
}

export default async function AnimePage() {
  const anime = await getAnime();

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      <main className="pt-28 px-4 md:px-12">
        <h1 className="text-3xl font-bold mb-8 text-white">Anime</h1>
        {anime.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-20">
            {anime.map((item, index) => (
              <MediaCard key={item._id} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 mt-20 text-center text-xl">
            No anime available yet.
          </div>
        )}
      </main>
    </div>
  );
}
