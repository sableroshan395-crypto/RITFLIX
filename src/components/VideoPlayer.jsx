"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Detects source type and renders the correct player:
 *  - Google Drive  → <iframe>
 *  - .m3u8 HLS     → <video> + hls.js (or native on Safari)
 *  - Direct MP4    → <video>
 */
export default function VideoPlayer({ src, autoPlay = true, onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [buffering, setBuffering] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  const isGoogleDrive = src && src.includes("drive.google.com");
  const isHLS = src && src.includes(".m3u8");

  // ── Google Drive: resolve preview iframe URL ──────────────────────────────
  const getDrivePreviewUrl = (url) => {
    try {
      if (url.includes("/file/d/")) {
        const fileId = url.split("/file/d/")[1].split("/")[0];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    } catch (_) {}
    return url;
  };

  // ── HLS / Native video setup ──────────────────────────────────────────────
  useEffect(() => {
    if (isGoogleDrive || !src) return;

    const video = videoRef.current;
    if (!video) return;

    // Reset state
    setPlayerError(null);
    setBuffering(true);

    // Destroy any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handleCanPlay = () => setBuffering(false);
    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => setBuffering(false);
    const handleError = (e) => {
      console.error("Video element error:", e);
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

    if (isHLS) {
      // Dynamic import to avoid SSR issues
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

          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setBuffering(false);
            if (autoPlay) {
              video.play().catch(() => {
                // Autoplay blocked — silently fail; user can press play
              });
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn("HLS network error — trying to recover...");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn("HLS media error — trying to recover...");
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

          hlsRef.current = hls;
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Native HLS (Safari / iOS)
          video.src = src;
          if (autoPlay) video.play().catch(() => {});
        } else {
          const msg = "HLS is not supported in this browser.";
          setPlayerError(msg);
          setBuffering(false);
          onError && onError(msg);
        }
      });
    } else {
      // Plain MP4 / direct video
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]); // re-run whenever src changes

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

  // ── Native video renderer (HLS + MP4) ────────────────────────────────────
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
              if (hlsRef.current) {
                hlsRef.current.startLoad();
              } else {
                video.load();
                video.play().catch(() => {});
              }
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
    </div>
  );
}
