"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MediaCard from "./MediaCard";

const MediaRow = ({ title, items = [] }) => {
  const rowRef = useRef(null);
  const [isMoved, setIsMoved] = useState(false);

  const handleClick = (direction) => {
    setIsMoved(true);
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // If no items, show empty or return null
  if (!items || items.length === 0) {
    // For development, inject placeholders
    items = Array(10).fill({
      _id: Math.random().toString(),
      title: "Placeholder Title",
      thumbnailUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop",
      genre: "Action"
    });
  }

  return (
    <div className="space-y-1 md:space-y-2 px-4 md:px-12 my-8">
      <h2 className="w-56 cursor-pointer text-sm font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
        {title}
      </h2>
      <div className="group relative md:-ml-2">
        <ChevronLeft 
          className={`absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 ${!isMoved && 'hidden'}`} 
          onClick={() => handleClick("left")} 
        />

        <div 
          ref={rowRef} 
          className="flex items-center space-x-2 md:space-x-4 overflow-x-scroll scrollbar-hide py-4 md:p-2"
        >
          {items.map((item, index) => (
            <MediaCard key={item._id} item={item} index={index} />
          ))}
        </div>

        <ChevronRight 
          className="absolute top-0 bottom-0 right-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100" 
          onClick={() => handleClick("right")} 
        />
      </div>
    </div>
  );
};

export default MediaRow;
