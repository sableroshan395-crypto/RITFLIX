"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Info, Sparkles, Clock, Calendar, Shield, Film, Tv, ListOrdered, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function MCUPage() {
  const [mcuList, setMcuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchOrderMode, setWatchOrderMode] = useState("chronologicalOrder"); // 'chronologicalOrder' | 'releaseOrder'
  const [selectedPhase, setSelectedPhase] = useState("All");
  const [selectedSaga, setSelectedSaga] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [activeMedia, setActiveMedia] = useState(null);

  useEffect(() => {
    fetchMcuMedia();
  }, [watchOrderMode, selectedPhase, selectedSaga, selectedType]);

  const fetchMcuMedia = async () => {
    setLoading(true);
    try {
      let url = `/api/media?isMCU=true&sortBy=${watchOrderMode}`;
      if (selectedPhase !== "All") url += `&phase=${encodeURIComponent(selectedPhase)}`;
      if (selectedSaga !== "All") url += `&saga=${encodeURIComponent(selectedSaga)}`;
      if (selectedType !== "All") url += `&type=${encodeURIComponent(selectedType)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMcuList(data);
        if (data.length > 0 && !activeMedia) {
          setActiveMedia(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch MCU media", err);
    } finally {
      setLoading(false);
    }
  };

  const phases = ["All", "Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"];
  const sagas = ["All", "The Infinity Saga", "The Multiverse Saga"];
  const types = ["All", "Movie", "Series"];

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white selection:bg-red-600 selection:text-white font-sans">
      <Navbar />

      {/* Marvel Environment Top Bar */}
      <div className="pt-20 px-4 md:px-12 bg-gradient-to-b from-[#1a0507] via-[#0f0708] to-[#0b0c10] border-b border-red-900/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between py-6 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 transition text-red-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#E62429] text-white font-black text-xs px-2.5 py-0.5 tracking-widest rounded shadow-[0_0_10px_rgba(230,36,41,0.6)]">
                  MARVEL STUDIOS
                </span>
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Official Timeline Experience
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-100 to-red-400 mt-1 uppercase drop-shadow-[0_2px_10px_rgba(230,36,41,0.3)]">
                Marvel Cinematic Universe
              </h1>
            </div>
          </div>

          {/* Watch Order Toggle Buttons */}
          <div className="bg-red-950/40 p-1.5 rounded-xl border border-red-700/40 flex items-center gap-1 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setWatchOrderMode("chronologicalOrder")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                watchOrderMode === "chronologicalOrder"
                  ? "bg-[#E62429] text-white shadow-[0_0_15px_rgba(230,36,41,0.7)]"
                  : "text-gray-300 hover:text-white hover:bg-red-900/30"
              }`}
            >
              <Clock className="w-4 h-4" />
              Chronological Order
            </button>
            <button
              onClick={() => setWatchOrderMode("releaseOrder")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                watchOrderMode === "releaseOrder"
                  ? "bg-[#E62429] text-white shadow-[0_0_15px_rgba(230,36,41,0.7)]"
                  : "text-gray-300 hover:text-white hover:bg-red-900/30"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Release Date Order
            </button>
          </div>
        </div>
      </div>

      {/* Featured Banner (if activeMedia exists) */}
      {activeMedia && (
        <div className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden border-b border-red-900/20">
          <img
            src={activeMedia.bannerUrl || activeMedia.thumbnailUrl}
            alt={activeMedia.title}
            className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/70 to-transparent" />

          <div className="absolute bottom-10 left-4 md:left-12 max-w-2xl z-10 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-red-600/90 text-white font-extrabold text-xs px-3 py-1 rounded tracking-wider uppercase border border-red-400/50 shadow-[0_0_10px_rgba(230,36,41,0.5)]">
                {activeMedia.mcuPhase || "Phase 1"}
              </span>
              {activeMedia.mcuSaga && (
                <span className="bg-amber-950/80 text-amber-300 font-bold text-xs px-3 py-1 rounded border border-amber-600/40">
                  {activeMedia.mcuSaga}
                </span>
              )}
              <span className="bg-gray-900/90 text-gray-200 text-xs px-2.5 py-1 rounded border border-gray-700">
                {activeMedia.type}
              </span>
              <span className="text-red-400 font-black text-xs">
                #{watchOrderMode === "chronologicalOrder" ? (activeMedia.chronologicalOrder || 1) : (activeMedia.releaseOrder || 1)} IN TIMELINE
              </span>
            </div>

            <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tight line-clamp-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {activeMedia.title}
            </h2>

            <p className="text-gray-300 text-sm md:text-base line-clamp-3 leading-relaxed max-w-xl">
              {activeMedia.description}
            </p>

            <div className="flex items-center gap-4 pt-2">
              <Link
                href={`/watch/${activeMedia._id}`}
                className="bg-[#E62429] hover:bg-red-700 text-white px-8 py-3 rounded-lg font-extrabold text-sm md:text-base uppercase tracking-wider flex items-center gap-2 transition transform hover:scale-105 shadow-[0_0_25px_rgba(230,36,41,0.6)]"
              >
                <Play className="w-5 h-5 fill-current" /> Play Stream
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] p-4 rounded-2xl border border-red-900/30 shadow-xl">
          
          {/* Phases */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-red-500" /> Filter MCU Phase
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {phases.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPhase(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    selectedPhase === p
                      ? "bg-red-600 text-white shadow-[0_0_10px_rgba(230,36,41,0.5)]"
                      : "bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Sagas & Format */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Saga</span>
              <select
                value={selectedSaga}
                onChange={(e) => setSelectedSaga(e.target.value)}
                className="bg-gray-900 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-red-500"
              >
                {sagas.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-900 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-red-500"
              >
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-red-500" />
            <h3 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-white">
              {watchOrderMode === "chronologicalOrder" ? "Chronological Timeline Order" : "Release Order View"}
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-semibold">
            {mcuList.length} MCU {mcuList.length === 1 ? "Title" : "Titles"} Found
          </span>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-widest">Loading MCU Timeline...</p>
          </div>
        ) : mcuList.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 bg-[#12141c] rounded-2xl border border-red-900/30 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-red-950/60 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/30">
              <Film className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">No MCU Titles Uploaded Yet</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Use the Admin Dashboard to add MCU movies and series with Google Drive or .m3u8 stream links, or click below to seed starter MCU content!
            </p>
            <Link
              href="/admin"
              className="inline-block bg-[#E62429] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition shadow-[0_0_15px_rgba(230,36,41,0.5)]"
            >
              Open Admin MCU Uploader
            </Link>
          </div>
        ) : (
          /* Timeline Media Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mcuList.map((item, index) => {
              const orderIndex = watchOrderMode === "chronologicalOrder"
                ? (item.chronologicalOrder || index + 1)
                : (item.releaseOrder || index + 1);

              const isDrive = item.videoSource?.includes("drive.google.com") || item.videoSource?.includes("docs.google.com");

              return (
                <div
                  key={item._id}
                  onClick={() => setActiveMedia(item)}
                  className={`group relative bg-[#12141c] rounded-xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer ${
                    activeMedia?._id === item._id
                      ? "border-red-500 shadow-[0_0_20px_rgba(230,36,41,0.4)] scale-[1.02]"
                      : "border-gray-800/80 hover:border-red-700/60 hover:shadow-lg"
                  }`}
                >
                  {/* Thumbnail & Order Badge */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-900">
                    <img
                      src={item.thumbnailUrl || item.bannerUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-transparent to-black/40" />

                    {/* Timeline Order Number Badge */}
                    <div className="absolute top-2 left-2 bg-[#E62429] text-white font-black text-xs px-2.5 py-1 rounded shadow-lg tracking-wider">
                      #{orderIndex}
                    </div>

                    {/* Stream Source Badge */}
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-[10px] font-bold text-gray-200 px-2 py-0.5 rounded border border-white/10">
                      {isDrive ? "GDrive" : "HLS m3u8"}
                    </div>

                    {/* Hover Quick Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                      <Link
                        href={`/watch/${item._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 h-12 bg-[#E62429] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(230,36,41,0.8)] transform group-hover:scale-110 transition"
                      >
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1 font-semibold">
                        <span className="text-red-400">{item.mcuPhase || "Phase 1"}</span>
                        <span>{item.type}</span>
                      </div>
                      <h4 className="font-extrabold text-white text-base line-clamp-1 group-hover:text-red-400 transition">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">{item.genre || "Marvel"}</span>
                      <Link
                        href={`/watch/${item._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                      >
                        Watch Now →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
