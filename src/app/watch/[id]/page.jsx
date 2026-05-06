"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, SkipForward } from "lucide-react";
import ReactPlayer from "react-player";

function WatchPlayer() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const seasonQuery = searchParams.get("season");
  const episodeQuery = searchParams.get("episode");
  
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef(null);

  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 3500); // 3.5 seconds idle time
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

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
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-2xl mb-4">Media not found</h1>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const isGoogleDriveLink = (url) => {
    return url && url.includes("drive.google.com");
  };

  const getGoogleDrivePreviewUrl = (url) => {
    try {
      if (url.includes("drive.google.com/file/d/")) {
        const fileId = url.split("/file/d/")[1].split("/")[0];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    } catch (e) {
      console.error("Error parsing Google Drive URL", e);
    }
    return url;
  };

  const hasSeasons = media.seasons && media.seasons.length > 0;
  
  // Determine video to play and navigation context
  let currentVideoSource = media.videoSource;
  let episodeTitle = "";
  let contextTitle = media.title;
  let hasNextEpisode = false;
  let nextEpisodeUrl = "";
  
  if (hasSeasons) {
    const sIndex = seasonQuery ? parseInt(seasonQuery, 10) : 0;
    const epIndex = episodeQuery ? parseInt(episodeQuery, 10) : 0;
    
    if (media.seasons[sIndex] && media.seasons[sIndex].episodes[epIndex]) {
      const ep = media.seasons[sIndex].episodes[epIndex];
      const season = media.seasons[sIndex];
      
      currentVideoSource = ep.videoSource;
      episodeTitle = ep.title;
      contextTitle = `${media.title} • S${season.seasonNumber}:E${ep.episodeNumber}`;
      
      // Check for next episode in current season
      if (media.seasons[sIndex].episodes[epIndex + 1]) {
        hasNextEpisode = true;
        nextEpisodeUrl = `/watch/${media._id}?season=${sIndex}&episode=${epIndex + 1}`;
      } 
      // Check for first episode in next season
      else if (media.seasons[sIndex + 1] && media.seasons[sIndex + 1].episodes[0]) {
        hasNextEpisode = true;
        nextEpisodeUrl = `/watch/${media._id}?season=${sIndex + 1}&episode=0`;
      }
    } else if (media.seasons[0] && media.seasons[0].episodes[0]) {
      currentVideoSource = media.seasons[0].episodes[0].videoSource;
    }
  }

  return (
    <div 
      className="h-screen w-full bg-black relative overflow-hidden flex flex-col"
      onMouseMove={resetIdleTimer}
      onClick={resetIdleTimer}
      onTouchStart={resetIdleTimer}
    >
      {/* Video Player Layer */}
      <div className="absolute inset-0 z-0">
        {currentVideoSource ? (
          isGoogleDriveLink(currentVideoSource) ? (
            <iframe
              src={getGoogleDrivePreviewUrl(currentVideoSource)}
              width="100%"
              height="100%"
              allow="autoplay"
              allowFullScreen
              className="border-none bg-black w-full h-full"
            ></iframe>
          ) : (
            <ReactPlayer
              url={currentVideoSource}
              width="100%"
              height="100%"
              controls={true}
              playing={true}
              style={{ backgroundColor: "black" }}
              config={{
                youtube: { playerVars: { showinfo: 1 } }
              }}
            />
          )
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-white">No video source available for this episode.</p>
          </div>
        )}
      </div>

      {/* Logical Player Overlay Layer */}
      <div 
        className={`absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-500 pointer-events-none ${isIdle ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Top Header */}
        <div className="w-full bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-4 pb-16 px-4 md:px-8 flex items-start gap-4 pointer-events-auto">
          <div 
            className="cursor-pointer text-white hover:text-gray-300 transition flex items-center justify-center p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="flex flex-col text-white mt-1 md:mt-2">
            <h1 className="font-bold text-lg md:text-2xl tracking-wide drop-shadow-md">{contextTitle}</h1>
            {episodeTitle && <h2 className="text-sm md:text-lg text-gray-300 drop-shadow-md">{episodeTitle}</h2>}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-8 px-6 md:px-12 flex items-end justify-end pointer-events-auto">
          {hasNextEpisode && (
            <button 
              onClick={() => {
                setLoading(true);
                router.push(nextEpisodeUrl);
              }}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded font-bold hover:bg-gray-200 transition shadow-lg group"
            >
              <span className="text-sm md:text-base">Next Episode</span>
              <SkipForward className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <WatchPlayer />
    </Suspense>
  );
}
