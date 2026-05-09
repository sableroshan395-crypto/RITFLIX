"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Unified video player supporting:
 *  - Google Drive  → <iframe>
 *  - .m3u8 HLS     → <video> + hls.js (or native on Safari)
 *  - Direct MP4    → <video>
 *  - Separate audio tracks (each with its own .m3u8 or MP4 URL)
 */
export default function VideoPlayer({
  src,
  audioTracks = [],
  autoPlay = true,
  onError,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const hlsVideoRef = useRef(null);
  const hlsAudioRef = useRef(null);
  const syncIntervalRef = useRef(null);

  const [buffering, setBuffering] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [activeAudioIdx, setActiveAudioIdx] = useState(() => {
    if (!audioTracks || audioTracks.length === 0) return 0;
    const defIdx = audioTracks.findIndex((t) => t.default);
    return defIdx !== -1 ? defIdx : 0;
  });
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const isGoogleDrive = src && src.includes("drive.google.com");
  const isHLS = src && src.includes(".m3u8");
  const hasAudioTracks = audioTracks && audioTracks.length > 0;

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

  // ── Sync audio with video ────────────────────────────────────────────────
  const syncAudioToVideo = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    // Sync play / pause state
    if (video.paused && !audio.paused) audio.pause();
    if (!video.paused && audio.paused) audio.play().catch(() => {});

    // Keep audio in sync (drift threshold 0.3s)
    const drift = Math.abs(video.currentTime - audio.currentTime);
    if (drift > 0.3) {
      audio.currentTime = video.currentTime;
    }
  }, []);

  // ── Setup sync listeners ─────────────────────────────────────────────────
  const setupSync = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const onPlay = () => { audio.currentTime = video.currentTime; audio.play().catch(() => {}); };
    const onPause = () => audio.pause();
    const onSeeked = () => { audio.currentTime = video.currentTime; };
    const onRateChange = () => { audio.playbackRate = video.playbackRate; };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ratechange", onRateChange);

    // Periodic drift correction
    syncIntervalRef.current = setInterval(syncAudioToVideo, 500);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ratechange", onRateChange);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [syncAudioToVideo]);

  // Handle src changes to reset default track
  useEffect(() => {
    if (audioTracks && audioTracks.length > 0) {
      const defIdx = audioTracks.findIndex((t) => t.default);
      setActiveAudioIdx(defIdx !== -1 ? defIdx : 0);
    }
  }, [src]);

  // ── Main video setup ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isGoogleDrive || !src) return;

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

    // If we have audio tracks, mute the video element
    if (hasAudioTracks) {
      video.muted = true;
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
    if (!hasAudioTracks || isGoogleDrive) return;

    const audio = audioRef.current;
    if (!audio) return;

    destroyHls(hlsAudioRef);

    const track = audioTracks[activeAudioIdx];
    if (!track || !track.url) return;

    loadSource(track.url, audio, hlsAudioRef, () => {
      const video = videoRef.current;
      if (video) {
        audio.currentTime = video.currentTime;
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
  }, [activeAudioIdx, audioTracks, hasAudioTracks, isGoogleDrive, loadSource, setupSync]);

  // ── Close audio menu on outside click ────────────────────────────────────
  useEffect(() => {
    if (!showAudioMenu) return;
    const close = () => setShowAudioMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showAudioMenu]);

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

      {/* Audio track switcher button */}
      {hasAudioTracks && audioTracks.length > 1 && (
        <div className="vp-audio-switcher" onClick={(e) => e.stopPropagation()}>
          <button
            className="vp-audio-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowAudioMenu((v) => !v);
            }}
            title="Audio Track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="vp-audio-icon">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <span className="vp-audio-label">{audioTracks[activeAudioIdx]?.name || audioTracks[activeAudioIdx]?.label || "Audio"}</span>
          </button>

          {showAudioMenu && (
            <div className="vp-audio-menu">
              <div className="vp-audio-menu-title">Audio Track</div>
              {audioTracks.map((t, i) => (
                <button
                  key={i}
                  className={`vp-audio-menu-item ${i === activeAudioIdx ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAudioIdx(i);
                    setShowAudioMenu(false);
                  }}
                >
                  {i === activeAudioIdx && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="vp-check-icon">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {t.name || t.label}
                </button>
              ))}
            </div>
          )}
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
