"use client";

import { Info, Play } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const HeroBanner = ({ featuredMedia }) => {
  // If no featured media, use a placeholder
  const media = featuredMedia || {
    _id: "placeholder",
    title: "Demon Slayer: Kimetsu no Yaiba",
    description: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.",
    bannerUrl: "https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=2070&auto=format&fit=crop", // Placeholder image
  };

  return (
    <div className="relative w-full h-[85vh] sm:h-[90vh]">
      <div className="absolute w-full h-full">
        <img
          src={media.bannerUrl}
          alt={media.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 w-full h-full bg-gradient-to-t from-[#141414] via-black/40 to-transparent" />
        <div className="absolute top-0 w-full h-full bg-gradient-to-r from-[#141414]/90 via-[#141414]/40 to-transparent" />
      </div>

      <div className="absolute top-[35%] sm:top-[40%] px-4 md:px-12 w-full max-w-3xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg mb-4 line-clamp-2"
        >
          {media.title}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm md:text-lg text-gray-200 drop-shadow-md mb-8 line-clamp-3 md:line-clamp-4"
        >
          {media.description}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex items-center gap-4"
        >
          <Link href={`/info/${media._id}`}>
            <button className="flex items-center gap-2 bg-white text-black px-6 py-2 md:py-3 rounded hover:bg-white/80 transition font-semibold text-lg">
              <Play className="w-6 h-6 fill-black" />
              Play
            </button>
          </Link>
          <Link href={`/info/${media._id}`}>
            <button className="flex items-center gap-2 bg-gray-500/70 text-white px-6 py-2 md:py-3 rounded hover:bg-gray-500/50 transition font-semibold text-lg">
              <Info className="w-6 h-6" />
              More Info
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroBanner;
