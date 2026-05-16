"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Unified video player supporting:
 *  - YouTube       → <iframe> embed (supports youtube.com/watch, youtu.be, youtube.com/embed)
 *  - Google Drive  → <iframe>
 *  - .m3u8 HLS     → <video> + hls.js (or native on Safari)
 *  - Direct MP4    → <video>
 *  - Separate audio tracks (each with its own .m3u8 or MP4 URL)
 */
export default function VideoPlayer({
  src,
  audioTracks = [],
  activeAudioIdx = 0,
  autoPlay = true,
  onError,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const hlsVideoRef = useRef(null);
  const hlsAudioRef = useRef(null);

  const [buffering, setBuffering] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // Track user mute intent separately from the forced video mute
  const userMutedRef = useRef(false);
  const userVolumeRef = useRef(1);

  // ── Source type detection ─────────────────────────────────────────────────
  const isYouTube = src && (
    src.includes("youtube.com/watch") ||
    src.includes("youtu.be/") ||
    src.includes("youtube.com/embed/") ||
    src.includes("youtube.com/shorts/")
  );
  const isGoogleDrive = src && src.includes("drive.google.com");
  const isHLS = src && src.includes(".m3u8");
  const hasAudioTracks = audioTracks && audioTracks.length > 0;

  // ── YouTube helpers ───────────────────────────────────────────────────────
  const getYouTubeEmbedUrl = (url) => {
    try {
      let videoId = null;

      // youtube.com/watch?v=VIDEO_ID
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v");
      }
      // youtu.be/VIDEO_ID
      else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split(/[?&#]/)[0];
      }
      // youtube.com/embed/VIDEO_ID (already embed format)
      else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("youtube.com/embed/")[1].split(/[?&#]/)[0];
      }
      // youtube.com/shorts/VIDEO_ID
      else if (url.includes("youtube.com/shorts/")) {
        videoId = url.split("youtube.com/shorts/")[1].split(/[?&#]/)[0];
      }

      if (videoId) {
        const params = new URLSearchParams({
          autoplay: autoPlay ? "1" : "0",
          rel: "0",           // don't show related videos from other channels
          modestbranding: "1", // minimal YouTube branding
          fs: "1",            // allow fullscreen
          iv_load_policy: "3", // hide annotations
          cc_load_policy: "0", // hide captions by default
        });
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      }
    } catch (_) {}
    return url;
  };

  // ── Google Drive helpers ──────────────────────────────────────────────────
  const getDrivePreviewUrl = (url) => {
    try {
      if (url.includes("/file/d/")) {
        const fileId = url.split("/file/d/")[1].split("/")[0];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    } catch (_) {}
    return url;
  };

  // ── Load an HLS or direct source into an HTML media element ───────────────
  const loadSource = useCallback((url, mediaEl, hlsRefObj, onReady) => {
    const isM3u8 = url && url.includes(".m3u8");

    if (isM3u8) {
      import("hls.js").then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 60,
            maxMaxBufferLength: 600,
            xhrSetup: (xhr) => {
              xhr.withCredentials = false;
            },
          });

          hls.loadSource(url);
          hls.attachMedia(mediaEl);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            onReady && onReady();
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn("HLS network error — recovering…");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn("HLS media error — recovering…");
                  hls.recoverMediaError();
                  break;
                default: {
                  const msg =
                    data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR
                      ? "Failed to load playlist. The link may have expired."
                      : data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR
                      ? "Invalid HLS playlist."
                      : `Stream error: ${data.details}`;
                  setPlayerError(msg);
                  setBuffering(false);
                  onError && onError(msg);
                  hls.destroy();
                }
              }
            }
          });

          hlsRefObj.current = hls;
        } else if (mediaEl.canPlayType("application/vnd.apple.mpegurl")) {
          mediaEl.src = url;
          onReady && onReady();
        } else {
          setPlayerError("HLS is not supported in this browser.");
          setBuffering(false);
        }
      });
    } else {
      // Direct MP4 / other
      mediaEl.src = url;
      onReady && onReady();
    }
  }, [onError]);

  // ── Destroy HLS helper ───────────────────────────────────────────────────
  const destroyHls = (hlsRefObj) => {
    if (hlsRefObj.current) {
      hlsRefObj.current.destroy();
      hlsRefObj.current = null;
    }
  };

  // ── Smooth sync: use playbackRate nudging for small drift, hard-jump only
  //    for large drift. This eliminates audible clicks/skips. ───────────────
  const HARD_SYNC_THRESHOLD = 0.5;  // seconds – hard-jump if drift exceeds this
  const SOFT_SYNC_THRESHOLD = 0.05; // seconds – below this, audio is "in sync"
  const RATE_NUDGE = 0.02;          // speed up / slow down by 2 %
  const rafRef = useRef(null);
  const userRateRef = useRef(1);     // track the user's chosen playback rate

  const smoothSync = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || video.paused) {
      rafRef.current = requestAnimationFrame(smoothSync);
      return;
    }

    const drift = video.currentTime - audio.currentTime; // positive = audio behind
    const absDrift = Math.abs(drift);
    const baseRate = userRateRef.current;

    if (absDrift > HARD_SYNC_THRESHOLD) {
      // Large drift → hard-jump (only noticeable on seeks / long stalls)
      audio.currentTime = video.currentTime;
      audio.playbackRate = baseRate;
    } else if (absDrift > SOFT_SYNC_THRESHOLD) {
      // Small drift → gently nudge playback rate
      audio.playbackRate = drift > 0
        ? baseRate + RATE_NUDGE   // audio behind → speed it up
        : baseRate - RATE_NUDGE;  // audio ahead  → slow it down
    } else {
      // In sync → restore normal rate
      if (audio.playbackRate !== baseRate) {
        audio.playbackRate = baseRate;
      }
    }

    rafRef.current = requestAnimationFrame(smoothSync);
  }, []);

  // ── Setup sync listeners ─────────────────────────────────────────────────
  const setupSync = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const onPlay = () => {
      // Only hard-sync on initial play or resume after long pause
      const drift = Math.abs(video.currentTime - audio.currentTime);
      if (drift > HARD_SYNC_THRESHOLD) {
        audio.currentTime = video.currentTime;
      }
      audio.play().catch(() => {});
    };
    const onPause = () => audio.pause();
    const onSeeked = () => {
      // Hard-sync is fine on user-initiated seek
      audio.currentTime = video.currentTime;
    };
    const onRateChange = () => {
      userRateRef.current = video.playbackRate;
      audio.playbackRate = video.playbackRate;
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ratechange", onRateChange);

    // Start smooth sync loop via requestAnimationFrame
    rafRef.current = requestAnimationFrame(smoothSync);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ratechange", onRateChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [smoothSync]);

  // ── Main video setup ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isGoogleDrive || isYouTube || !src) return;

    const video = videoRef.current;
    if (!video) return;

    setPlayerError(null);
    setBuffering(true);
    destroyHls(hlsVideoRef);

    const handleCanPlay = () => setBuffering(false);
    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => setBuffering(false);
    const handleError = () => {
      const err = video.error;
      let msg = "Playback error.";
      if (err) {
        if (err.code === MediaError.MEDIA_ERR_NETWORK) msg = "Network error — check your connection.";
        else if (err.code === MediaError.MEDIA_ERR_DECODE) msg = "Video decode error.";
        else if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) msg = "Format not supported.";
      }
      setPlayerError(msg);
      setBuffering(false);
      onError && onError(msg);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    // If we have audio tracks, mute the video element (audio comes from <audio>)
    if (hasAudioTracks) {
      video.muted = true;

      // Mirror native volume/mute controls to the hidden audio element
      let isSelfUpdate = false;
      const handleVolumeChange = () => {
        if (isSelfUpdate) return; // guard against infinite loop
        const audio = audioRef.current;
        if (!audio) return;

        // Detect user mute intent: the native controls toggle video.muted
        // even though we force it back to true.
        // When the user clicks mute on native controls, video.muted becomes
        // false (since it was true). We detect this and toggle our own state.
        if (!video.muted) {
          // User toggled mute via native controls
          userMutedRef.current = !userMutedRef.current;
          // Force video back to muted (audio comes from <audio>)
          isSelfUpdate = true;
          video.muted = true;
          isSelfUpdate = false;
        }

        // Mirror volume level
        userVolumeRef.current = video.volume;
        audio.volume = video.volume;
        audio.muted = userMutedRef.current;
      };

      video.addEventListener("volumechange", handleVolumeChange);

      loadSource(src, video, hlsVideoRef, () => {
        setBuffering(false);
        if (autoPlay) video.play().catch(() => {});
      });

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("waiting", handleWaiting);
        video.removeEventListener("playing", handlePlaying);
        video.removeEventListener("error", handleError);
        video.removeEventListener("volumechange", handleVolumeChange);
        destroyHls(hlsVideoRef);
      };
    }

    loadSource(src, video, hlsVideoRef, () => {
      setBuffering(false);
      if (autoPlay) video.play().catch(() => {});
    });

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      destroyHls(hlsVideoRef);
    };
  }, [src, hasAudioTracks]);

  // ── Audio track setup — runs when activeAudioIdx or audioTracks change ───
  useEffect(() => {
    if (!hasAudioTracks || isGoogleDrive || isYouTube) return;

    const audio = audioRef.current;
    if (!audio) return;

    destroyHls(hlsAudioRef);

    const track = audioTracks[activeAudioIdx];
    if (!track || !track.url) return;

    // Apply current user volume/mute state to the audio element
    audio.volume = userVolumeRef.current;
    audio.muted = userMutedRef.current;

    loadSource(track.url, audio, hlsAudioRef, () => {
      const video = videoRef.current;
      if (video) {
        audio.currentTime = video.currentTime;
        audio.volume = userVolumeRef.current;
        audio.muted = userMutedRef.current;
        if (!video.paused) {
          audio.play().catch(() => {});
        }
      }
    });

    const cleanupSync = setupSync();

    return () => {
      cleanupSync && cleanupSync();
      destroyHls(hlsAudioRef);
    };
  }, [activeAudioIdx, audioTracks, hasAudioTracks, isGoogleDrive, isYouTube, loadSource, setupSync]);

  // ── YouTube renderer ──────────────────────────────────────────────────────
  if (isYouTube) {
    return (
      <div className="vp-root">
        <div className="vp-youtube-wrapper">
          <iframe
            src={getYouTubeEmbedUrl(src)}
            className="vp-youtube-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            title="Video Player"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    );
  }

  // ── Google Drive renderer ─────────────────────────────────────────────────
  if (isGoogleDrive) {
    return (
      <div className="vp-root">
        <iframe
          src={getDrivePreviewUrl(src)}
          className="vp-iframe"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video Player"
        />
      </div>
    );
  }

  // ── Native video + audio renderer ────────────────────────────────────────
  return (
    <div className="vp-root">
      {/* Buffering spinner */}
      {buffering && !playerError && (
        <div className="vp-overlay vp-buffering" aria-label="Buffering">
          <div className="vp-spinner" />
          <p className="vp-status-text">Buffering…</p>
        </div>
      )}

      {/* Error state */}
      {playerError && (
        <div className="vp-overlay vp-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="vp-error-icon"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
          <p className="vp-error-title">Playback Failed</p>
          <p className="vp-error-msg">{playerError}</p>
          <button
            className="vp-retry-btn"
            onClick={() => {
              setPlayerError(null);
              setBuffering(true);
              const video = videoRef.current;
              if (!video) return;
              if (hlsVideoRef.current) hlsVideoRef.current.startLoad();
              else { video.load(); video.play().catch(() => {}); }
            }}
          >
            Retry
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        className="vp-video"
        controls
        playsInline
        autoPlay={autoPlay}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Hidden audio element for separate audio track playback */}
      {hasAudioTracks && (
        <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />
      )}
    </div>
  );
}
