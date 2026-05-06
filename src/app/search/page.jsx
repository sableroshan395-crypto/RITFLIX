"use client";

import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import MediaCard from "@/components/MediaCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allMedia, setAllMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMedia = async () => {
      try {
        const res = await fetch("/api/media");
        if (res.ok) {
          const data = await res.json();
          setAllMedia(data);
        }
      } catch (error) {
        console.error("Failed to fetch media for search", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllMedia();
  }, []);

  const searchResults = query.length > 1 
    ? allMedia.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.genre.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      
      <main className="pt-28 px-4 md:px-12">
        <div className="relative max-w-3xl mx-auto mb-12">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies, series, or anime by title or genre..."
            className="w-full bg-[#2a2a2a] text-white text-lg py-4 pl-14 pr-4 rounded-full focus:outline-none focus:ring-2 focus:ring-primary shadow-lg"
          />
        </div>

        {query.length > 1 && (
          <div>
            <h2 className="text-xl text-gray-400 mb-6">
              Results for "<span className="text-white">{query}</span>"
            </h2>
            
            {loading ? (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-xl">Loading...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-20">
                {searchResults.map((item, index) => (
                  <MediaCard key={item._id} item={item} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-xl">No results found.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
