"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Plus, ThumbsUp } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function InfoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(0);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/media/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.seasons && data.seasons.length > 0) {
            data.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
            data.seasons.forEach(s => {
              if (s.episodes) s.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
            });
          }
          setMedia(data);
        }
      } catch (error) {
        console.error("Failed to fetch media", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#141414]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#141414] text-white">
        <h1 className="text-2xl mb-4">Media not found</h1>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const hasSeasons = media.seasons && media.seasons.length > 0;
  const totalEpisodes = hasSeasons 
    ? media.seasons.reduce((total, s) => total + (s.episodes?.length || 0), 0)
    : 0;

  const currentEpisodes = hasSeasons && media.seasons[selectedSeason] 
    ? media.seasons[selectedSeason].episodes 
    : [];

  // Fallback to bannerUrl if thumbnailUrl is missing, though we prefer banner for hero.
  const heroImage = media.bannerUrl || media.thumbnailUrl || "https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="relative w-full h-[70vh] md:h-[85vh]">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={heroImage}
            alt={media.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays for the Netflix look */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/50 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex flex-col justify-end px-4 md:px-16 lg:px-24 pb-8 md:pb-24 max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white mb-4 md:mb-6 tracking-wide drop-shadow-lg uppercase" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
            {media.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <button 
              onClick={() => router.push(hasSeasons ? `/watch/${media._id}?season=0&episode=0` : `/watch/${media._id}`)}
              className="flex items-center gap-1 md:gap-2 bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded text-sm md:text-xl font-semibold hover:bg-gray-200 transition"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" />
              Play
            </button>
            <button className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-400 bg-black/40 hover:border-white transition">
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
            <button className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-400 bg-black/40 hover:border-white transition">
              <ThumbsUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm md:text-base font-semibold text-gray-300 mb-4">
            <span className="text-green-500 font-bold">98% Match</span>
            <span>2026</span>
            <span className="border border-gray-500 px-1 text-xs">U/A 18+</span>
            {hasSeasons && <span>{media.seasons.length} Seasons</span>}
            {media.type === "Movie" && media.duration && <span>{media.duration}</span>}
            <span className="border border-gray-500 px-1 text-xs">HD</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <p className="text-sm md:text-lg text-gray-200 md:w-2/3 leading-relaxed drop-shadow-md">
              {media.description}
            </p>
            <div className="md:w-1/3 space-y-2 text-sm">
              <p><span className="text-gray-500">Genres:</span> <span className="text-gray-300">{media.genre}</span></p>
              <p><span className="text-gray-500">This show is:</span> <span className="text-gray-300">Ominous, Scary, Suspenseful</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      {hasSeasons && (
        <div className="px-4 md:px-16 lg:px-24 max-w-7xl mx-auto pb-20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Episodes</h2>
            <div className="relative">
              <select 
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="appearance-none bg-[#242424] px-4 py-2 pr-10 rounded text-white text-sm font-semibold border border-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {media.seasons.map((season, index) => (
                  <option key={index} value={index}>
                    Season {season.seasonNumber} ({season.episodes.length} EP)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col border-t border-[#333]">
            {currentEpisodes.length === 0 && (
              <p className="p-6 text-gray-500 italic">No episodes available in this season yet.</p>
            )}
            {currentEpisodes.map((ep, index) => (
              <div 
                key={index} 
                className="group flex flex-row items-start md:items-center p-4 md:p-6 border-b border-[#333] hover:bg-[#2a2a2a] cursor-pointer transition duration-200 gap-3 md:gap-4"
                onClick={() => router.push(`/watch/${media._id}?season=${selectedSeason}&episode=${index}`)}
              >
                <div className="text-xl md:text-3xl text-gray-400 font-light w-6 md:w-12 hidden sm:block flex-shrink-0">{ep.episodeNumber}</div>
                
                <div className="relative w-28 h-16 sm:w-32 sm:h-20 md:w-40 md:h-24 flex-shrink-0 bg-black rounded overflow-hidden">
                  <img 
                    src={media.thumbnailUrl || heroImage} 
                    alt={ep.title} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
                    <div className="bg-black/50 p-2 rounded-full border border-white">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  {/* Fake progress bar */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                    <div className="h-full bg-red-600 w-1/3"></div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <h3 className="font-semibold text-sm md:text-lg text-white line-clamp-1">{ep.title}</h3>
                    {ep.duration && (
                      <span className="text-gray-400 text-xs md:text-sm hidden md:block">{ep.duration}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm line-clamp-2 md:line-clamp-3">
                    {`Episode ${ep.episodeNumber} of ${media.title} Season ${media.seasons[selectedSeason].seasonNumber}. `} 
                    {media.description.length > 100 ? media.description.substring(0, 100) + "..." : media.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
