"use client";

import Navbar from "@/components/Navbar";
import MediaCard from "@/components/MediaCard";

export default function MyList() {
  // Mock data for UI demonstration
  const wishlist = Array(6).fill(null).map((_, i) => ({
    _id: `wishlist-${i}`,
    title: "Wishlist Item",
    thumbnailUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop",
    genre: "Thriller"
  }));

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      
      <main className="pt-28 px-4 md:px-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-white">My List</h1>
        
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-20">
            {wishlist.map((item, index) => (
              <MediaCard key={item._id} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <p className="text-xl">You haven't added anything to your list yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
