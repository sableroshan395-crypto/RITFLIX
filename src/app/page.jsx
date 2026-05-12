import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import MediaRow from "@/components/MediaRow";
import dbConnect from "@/lib/mongodb";
import Media from "@/models/Media";

export const dynamic = "force-dynamic";

async function getMediaData() {
  await dbConnect();
  
  const allMedia = await Media.find().sort({ createdAt: -1 }).lean();
  
  // Serialize ObjectIds to strings so they can be passed to Client Components
  const serialize = (item) => {
    if (!item) return null;
    return {
      ...item,
      _id: item._id.toString(),
      createdAt: item.createdAt ? item.createdAt.toISOString() : null,
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
    };
  };

  const serializedMedia = allMedia.map(serialize);

  // Collect all featured items for the hero carousel
  const featuredItems = serializedMedia.filter(m => m.isFeatured);
  // Fallback: if no items are marked as featured, use the first 5 most recent
  const heroBannerItems = featuredItems.length > 0 
    ? featuredItems 
    : serializedMedia.slice(0, 5);

  return {
    featured: heroBannerItems,
    trending: serializedMedia,
    anime: serializedMedia.filter(m => m.type === "Anime"),
    movies: serializedMedia.filter(m => m.type === "Movie"),
    series: serializedMedia.filter(m => m.type === "Series"),
  };
}

export default async function Home() {
  const { featured, trending, anime, movies, series } = await getMediaData();

  return (
    <main className="relative min-h-screen pb-24 lg:space-y-24">
      <Navbar />
      <HeroBanner featuredMedia={featured} />
      
      <section className="md:space-y-24 mt-12 md:-mt-32 relative z-20">
        <MediaRow title="Trending Now" items={trending} />
        {anime.length > 0 && <MediaRow title="Recently Added Anime" items={anime} />}
        {movies.length > 0 && <MediaRow title="Action Movies" items={movies} />}
        {series.length > 0 && <MediaRow title="Web Series" items={series} />}
      </section>
    </main>
  );
}
