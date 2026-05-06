"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReactPlayer from "react-player";

function WatchPlayer() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const seasonQuery = searchParams.get("season");
  const episodeQuery = searchParams.get("episode");
  
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);

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
  
  // Determine which video to play based on query param or default to main videoSource
  let currentVideoSource = media.videoSource;
  
  if (hasSeasons) {
    const sIndex = seasonQuery ? parseInt(seasonQuery, 10) : 0;
    const epIndex = episodeQuery ? parseInt(episodeQuery, 10) : 0;
    
    if (media.seasons[sIndex] && media.seasons[sIndex].episodes[epIndex]) {
      currentVideoSource = media.seasons[sIndex].episodes[epIndex].videoSource;
    } else if (media.seasons[0] && media.seasons[0].episodes[0]) {
      currentVideoSource = media.seasons[0].episodes[0].videoSource; // Fallback to first episode of first season
    }
  }

  return (
    <div className="h-screen w-full bg-black relative">
      {/* Clean, unobtrusive back button. Top left, far away from Google Drive top right buttons */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none"></div>
      
      <div 
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50 cursor-pointer text-white hover:text-gray-300 transition flex items-center gap-2 group pointer-events-auto bg-black/30 p-2 md:p-0 md:bg-transparent rounded-full md:rounded-none"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 drop-shadow-lg" />
        <span className="font-bold text-lg hidden md:inline-block opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">Back</span>
      </div>

      <div className="w-full h-full">
        {currentVideoSource ? (
          isGoogleDriveLink(currentVideoSource) ? (
            <iframe
              src={getGoogleDrivePreviewUrl(currentVideoSource)}
              width="100%"
              height="100%"
              allow="autoplay"
              allowFullScreen
              className="border-none bg-black relative z-10"
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
                youtube: {
                  playerVars: { showinfo: 1 }
                }
              }}
              className="relative z-10"
            />
          )
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-white">No video source available for this episode.</p>
          </div>
        )}
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
