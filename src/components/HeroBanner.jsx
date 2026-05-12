"use client";

import { Info, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

const SLIDE_DURATION = 4000; // 4 seconds per slide

const HeroBanner = ({ featuredMedia = [] }) => {
  // Normalize to array — support both single item and array
  const mediaList = Array.isArray(featuredMedia)
    ? featuredMedia
    : featuredMedia
    ? [featuredMedia]
    : [];

  // Fallback if no featured media at all
  const slides =
    mediaList.length > 0
      ? mediaList
      : [
          {
            _id: "placeholder",
            title: "Welcome to RitFlix",
            description:
              "Discover your next favorite movie, series, or anime. Start exploring our library now.",
            bannerUrl:
              "https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=2070&auto=format&fit=crop",
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const goToSlide = useCallback(
    (index) => {
      setCurrentIndex(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    []
  );

  const goNext = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  // Auto-advance timer with progress tracking
  useEffect(() => {
    if (slides.length <= 1) return;

    let animationFrame;

    const tick = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
        setProgress(pct);

        if (elapsed >= SLIDE_DURATION) {
          goNext();
          return;
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [currentIndex, isPaused, slides.length, goNext]);

  // Pause progress on hover
  useEffect(() => {
    if (isPaused) {
      // When pausing, we need to remember how much time has passed
      // so when we resume, we can continue from where we left off
    } else {
      // Resume: adjust startTime so elapsed matches current progress
      const elapsed = (progress / 100) * SLIDE_DURATION;
      startTimeRef.current = Date.now() - elapsed;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const currentMedia = slides[currentIndex];

  // Slide animation variants
  const slideVariants = {
    enter: {
      opacity: 0,
      scale: 1.05,
    },
    center: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.98,
    },
  };

  const contentVariants = {
    enter: { opacity: 0, y: 30 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div
      className="relative w-full h-[60vh] sm:h-[70vh] md:h-[85vh] overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background images with crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentIndex}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={currentMedia.bannerUrl}
            alt={currentMedia.title}
            className="w-full h-full object-cover object-[center_top]"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/90 via-[#141414]/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-4 md:px-12 pb-16 md:pb-28 w-full max-w-3xl z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Genre/Type badge */}
            {(currentMedia.type || currentMedia.genre) && (
              <div className="flex items-center gap-2 mb-3">
                {currentMedia.type && (
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase px-2 py-0.5 bg-primary/80 text-white rounded">
                    {currentMedia.type}
                  </span>
                )}
                {currentMedia.genre && (
                  <span className="text-[10px] sm:text-xs font-medium tracking-wide text-gray-300/90">
                    {currentMedia.genre}
                  </span>
                )}
              </div>
            )}

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg mb-2 md:mb-4 line-clamp-2">
              {currentMedia.title}
            </h1>

            <p className="text-xs md:text-base lg:text-lg text-gray-200 drop-shadow-md mb-4 md:mb-8 line-clamp-3 md:line-clamp-4">
              {currentMedia.description}
            </p>

            <div className="flex items-center gap-3 md:gap-4">
              <Link href={`/info/${currentMedia._id}`}>
                <button className="flex items-center gap-1 md:gap-2 bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded hover:bg-white/80 transition font-semibold text-sm md:text-lg shadow-lg">
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" />
                  Play
                </button>
              </Link>
              <Link href={`/info/${currentMedia._id}`}>
                <button className="flex items-center gap-1 md:gap-2 bg-gray-500/70 text-white px-4 py-2 md:px-6 md:py-3 rounded hover:bg-gray-500/50 transition font-semibold text-sm md:text-lg backdrop-blur-sm">
                  <Info className="w-5 h-5 md:w-6 md:h-6" />
                  More Info
                </button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows — only show if multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 
                       w-10 h-10 md:w-12 md:h-12 rounded-full 
                       bg-black/40 backdrop-blur-sm border border-white/10
                       flex items-center justify-center text-white/70 
                       hover:bg-black/60 hover:text-white hover:border-white/30
                       transition-all duration-300 
                       opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 
                       w-10 h-10 md:w-12 md:h-12 rounded-full 
                       bg-black/40 backdrop-blur-sm border border-white/10
                       flex items-center justify-center text-white/70 
                       hover:bg-black/60 hover:text-white hover:border-white/30
                       transition-all duration-300 
                       opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Bottom indicator bar — Netflix style progress pills */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 md:bottom-8 right-4 md:right-12 z-20 flex items-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide._id || index}
              onClick={() => goToSlide(index)}
              className="relative group/dot"
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            >
              {/* Background pill */}
              <div
                className={`h-[3px] rounded-full transition-all duration-300 overflow-hidden ${
                  index === currentIndex
                    ? "w-8 md:w-12 bg-white/30"
                    : "w-4 md:w-6 bg-white/20 hover:bg-white/40"
                }`}
              >
                {/* Progress fill for active slide */}
                {index === currentIndex && (
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {/* Filled bar for past slides */}
                {index < currentIndex && (
                  <div className="h-full w-full bg-white/60 rounded-full" />
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 
                            opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200
                            pointer-events-none whitespace-nowrap
                            bg-black/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded
                            border border-white/10">
                {slide.title}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Slide counter badge */}
      {slides.length > 1 && (
        <div className="absolute top-20 md:top-24 right-4 md:right-12 z-20 
                        bg-black/40 backdrop-blur-sm border border-white/10 
                        text-white/70 text-xs font-medium px-3 py-1 rounded-full
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {currentIndex + 1} / {slides.length}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
