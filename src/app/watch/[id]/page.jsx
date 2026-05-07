"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, SkipForward } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import VideoPlayer so hls.js is never bundled server-side
const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="vp-spinner" />
    </div>
  ),
});

function WatchPlayer() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const seasonQuery = searchParams.get("season");
  const episodeQuery = searchParams.get("episode");

  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [playerErrorMsg, setPlayerErrorMsg] = useState(null);
  const idleTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => setIsIdle(true), 3500);
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
            data.seasons.forEach((s) => {
              if (s.episodes)
                s.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
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

  // ── Loading / error screens ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="vp-spinner" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <h1 className="text-2xl">Media not found</h1>
        <button
          onClick={() => router.back()}
          className="text-[#e50914] hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ── Determine current video source and navigation ────────────────────────
  const hasSeasons = media.seasons && media.seasons.length > 0;

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

      if (media.seasons[sIndex].episodes[epIndex + 1]) {
        hasNextEpisode = true;
        nextEpisodeUrl = `/watch/${media._id}?season=${sIndex}&episode=${epIndex + 1}`;
      } else if (
        media.seasons[sIndex + 1] &&
        media.seasons[sIndex + 1].episodes[0]
      ) {
        hasNextEpisode = true;
        nextEpisodeUrl = `/watch/${media._id}?season=${sIndex + 1}&episode=0`;
      }
    } else if (media.seasons[0] && media.seasons[0].episodes[0]) {
      currentVideoSource = media.seasons[0].episodes[0].videoSource;
    }
  }

  // ── Interaction / fullscreen helpers ─────────────────────────────────────
  const handleInteraction = async () => {
    resetIdleTimer();
    if (!hasInteracted) {
      setHasInteracted(true);
      if (
        typeof window !== "undefined" &&
        window.innerWidth < 768 &&
        containerRef.current
      ) {
        try {
          if (
            !document.fullscreenElement &&
            containerRef.current.requestFullscreen
          ) {
            await containerRef.current.requestFullscreen();
          }
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock("landscape");
          }
        } catch (e) {
          console.warn("Fullscreen/Orientation lock failed:", e);
        }
      }
    }
  };

  const handleBack = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (e) {
      console.warn("Exit Fullscreen error:", e);
    }
    router.back();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-black relative overflow-hidden flex flex-col"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* ── Video layer ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {currentVideoSource ? (
          <VideoPlayer
            src={currentVideoSource}
            autoPlay
            onError={(msg) => setPlayerErrorMsg(msg)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-white/70 text-sm">
              No video source available for this episode.
            </p>
          </div>
        )}
      </div>

      {/* ── UI overlay (fades when idle) ─────────────────────── */}
      <div
        className={`absolute inset-0 z-10 flex flex-col justify-start transition-opacity duration-500 pointer-events-none ${
          isIdle ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Top gradient header */}
        <div className="w-full bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-4 pb-20 px-4 md:px-8 flex items-start justify-between gap-4 pointer-events-auto">
          {/* Back button + title */}
          <div className="flex items-start gap-3 md:gap-4 flex-1">
            <div
              className="cursor-pointer text-white hover:text-gray-300 transition flex items-center justify-center p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm shrink-0"
              onClick={handleBack}
            >
              <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex flex-col text-white mt-1 md:mt-2">
              <h1 className="font-bold text-base sm:text-lg md:text-2xl tracking-wide drop-shadow-md line-clamp-1">
                {contextTitle}
              </h1>
              {episodeTitle && (
                <h2 className="text-xs sm:text-sm md:text-lg text-gray-300 drop-shadow-md line-clamp-1">
                  {episodeTitle}
                </h2>
              )}
            </div>
          </div>

          {/* Next episode button */}
          {hasNextEpisode && (
            <button
              onClick={() => {
                setLoading(true);
                router.push(nextEpisodeUrl);
              }}
              className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white text-white hover:text-black border border-white/30 px-3 sm:px-4 py-1.5 md:px-6 md:py-2.5 rounded font-bold transition shadow-lg group backdrop-blur-sm shrink-0 mt-1"
            >
              <span className="text-xs sm:text-sm md:text-base hidden sm:inline-block">
                Next Episode
              </span>
              <span className="text-xs sm:text-sm md:text-base sm:hidden">
                Next
              </span>
              <SkipForward className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* Player error toast (shown even when overlay fades) */}
        {playerErrorMsg && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 border border-red-600/60 text-white text-sm px-5 py-3 rounded-lg backdrop-blur-sm pointer-events-auto shadow-xl max-w-sm text-center">
            <span className="text-red-400 font-semibold block mb-1">
              Playback Error
            </span>
            {playerErrorMsg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-black">
          <div className="vp-spinner" />
        </div>
      }
    >
      <WatchPlayer />
    </Suspense>
  );
}
