"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react";
import Link from "next/link";

const MediaCard = ({ item, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative h-24 min-w-[140px] cursor-pointer transition duration-200 ease-out sm:h-28 sm:min-w-[180px] md:h-36 md:min-w-[260px] md:hover:scale-105"
      onMouseEnter={() => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/info/${item._id}`}>
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="rounded-sm object-cover md:rounded h-full w-full"
        />
      </Link>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 z-50 w-full h-auto min-h-[200%] bg-[#141414] shadow-xl rounded-md overflow-hidden transform -translate-y-[20%] -translate-x-[5%] hidden md:block"
          >
            <div className="relative h-36 w-full">
              <Link href={`/info/${item._id}`}>
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="rounded-t-md object-cover w-full h-full cursor-pointer"
                />
              </Link>
            </div>
            
            <div className="p-3 bg-[#141414] rounded-b-md">
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/watch/${item._id}?episode=0`}>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-300 transition cursor-pointer">
                    <Play className="w-4 h-4 md:w-5 md:h-5 text-black ml-1" />
                  </div>
                </Link>
                <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-500 bg-[#2a2a2a] rounded-full flex items-center justify-center hover:border-white transition cursor-pointer text-white">
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-500 bg-[#2a2a2a] rounded-full flex items-center justify-center hover:border-white transition cursor-pointer text-white">
                  <ThumbsUp className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <Link href={`/info/${item._id}`} className="ml-auto">
                  <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-500 bg-[#2a2a2a] rounded-full flex items-center justify-center hover:border-white transition cursor-pointer text-white">
                    <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </Link>
              </div>
              
              <div className="text-white font-semibold text-sm md:text-base truncate mb-1">
                {item.title}
              </div>
              <div className="text-gray-400 text-xs md:text-sm font-semibold flex items-center gap-2">
                <span className="text-green-500">98% Match</span>
                <span className="border border-gray-500 px-1 rounded">HD</span>
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {item.genre}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaCard;
