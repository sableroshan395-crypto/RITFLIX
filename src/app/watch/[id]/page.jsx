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
  const [mobileStarted, setMobileStarted] = useState(false);
  const [activeAudioIdx, setActiveAudioIdx] = useState(0);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
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
  let currentAudioTracks = media.audioTracks || [];
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
      currentAudioTracks = ep.audioTracks || [];
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
      currentAudioTracks = media.seasons[0].episodes[0].audioTracks || [];
    }
  }

  useEffect(() => {
    if (media) {
      const defIdx = currentAudioTracks.findIndex(t => t.default);
      setActiveAudioIdx(defIdx !== -1 ? defIdx : 0);
    }
  }, [media, seasonQuery, episodeQuery]);

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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMobileStart = async () => {
    setMobileStarted(true);
    if (containerRef.current) {
      try {
        if (!document.fullscreenElement && containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        }
      } catch (e) {
        console.warn("Fullscreen/Orientation lock failed:", e);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isMobile && !mobileStarted) {
    return (
      <div
        ref={containerRef}
        className="h-screen w-full bg-[#141414] relative flex flex-col items-center justify-center text-white"
      >
        <div className="z-10 flex flex-col items-center gap-6 p-8 bg-[#181818] rounded-xl border border-gray-800 text-center shadow-2xl">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold text-white max-w-[250px] truncate">{contextTitle}</h1>
            {episodeTitle && <h2 className="text-sm text-gray-400 max-w-[250px] truncate">{episodeTitle}</h2>}
          </div>
          <button
            onClick={handleMobileStart}
            className="bg-[#e50914] hover:bg-[#f40612] text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(229,9,20,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
            Tap to Play
          </button>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            Automatically rotates to landscape
          </p>
        </div>
      </div>
    );
  }

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
            audioTracks={currentAudioTracks}
            activeAudioIdx={activeAudioIdx}
            autoPlay
            onError={setPlayerErrorMsg}
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

          {/* Right side controls: Audio Switcher + Next Episode */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0 mt-1 relative">
            {currentAudioTracks && currentAudioTracks.length > 1 && (
              <div className="relative pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAudioMenu(!showAudioMenu);
                  }}
                  className="flex items-center gap-1 sm:gap-2 bg-black/60 hover:bg-black/80 text-white border border-white/20 px-3 sm:px-4 py-1.5 md:py-2.5 rounded font-medium transition backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                  <span className="text-xs sm:text-sm md:text-base hidden sm:inline-block max-w-[100px] truncate">
                    {currentAudioTracks[activeAudioIdx]?.name || "Audio"}
                  </span>
                </button>

                {showAudioMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-black/95 border border-gray-800 rounded-lg shadow-2xl overflow-hidden py-1 z-50">
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                      Audio Tracks
                    </div>
                    {currentAudioTracks.map((t, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAudioIdx(i);
                          setShowAudioMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition ${i === activeAudioIdx ? "text-[#e50914] font-bold" : "text-white"}`}
                      >
                        {i === activeAudioIdx ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4 shrink-0">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <div className="w-4 h-4 shrink-0"></div>
                        )}
                        <span className="text-sm truncate">{t.name || t.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Next episode button */}
            {hasNextEpisode && (
              <button
                onClick={() => {
                  setLoading(true);
                  router.push(nextEpisodeUrl);
                }}
                className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white text-white hover:text-black border border-white/30 px-3 sm:px-4 py-1.5 md:px-6 md:py-2.5 rounded font-bold transition shadow-lg group backdrop-blur-sm pointer-events-auto"
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
