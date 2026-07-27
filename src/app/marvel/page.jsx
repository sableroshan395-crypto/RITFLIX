"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Sparkles,
  Clock,
  Calendar,
  Shield,
  Film,
  ListOrdered,
  Layers,
  Star,
  Zap,
  Globe,
  Flame,
  Clapperboard,
  Filter
} from "lucide-react";
import Navbar from "@/components/Navbar";

const MARVEL_UNIVERSES = [
  { id: "Infinity Saga", title: "Infinity Saga", badge: "Phases 1-3", hasPhases: true, phases: ["All", "Phase 1", "Phase 2", "Phase 3"] },
  { id: "Multiverse Saga", title: "Multiverse Saga", badge: "Phases 4-6", hasPhases: true, phases: ["All", "Phase 4", "Phase 5", "Phase 6"] },
  { id: "X-Men Universe", title: "X-Men Universe", badge: "Mutant Saga", hasPhases: false, phases: [] },
  { id: "Sony Spider-Man Universe", title: "Sony Spider-Man Universe", badge: "Spider-Verse", hasPhases: false, phases: [] },
  { id: "Fantastic Four", title: "Fantastic Four", badge: "First Family", hasPhases: false, phases: [] },
  { id: "Blade", title: "Blade", badge: "Daywalker", hasPhases: false, phases: [] },
  { id: "Ghost Rider", title: "Ghost Rider", badge: "Hellfire", hasPhases: false, phases: [] },
  { id: "Daredevil & Elektra", title: "Daredevil & Elektra", badge: "Vigilantes", hasPhases: false, phases: [] },
  { id: "Punisher", title: "Punisher", badge: "War Zone", hasPhases: false, phases: [] },
  { id: "Hulk", title: "Hulk", badge: "Gamma", hasPhases: false, phases: [] },
  { id: "Other Marvel Movies", title: "Other Marvel Movies", badge: "Specials", hasPhases: false, phases: [] },
  { id: "All", title: "All Marvel", badge: "Complete Collection", hasPhases: false, phases: [] },
];

function MarvelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sagaParam = searchParams.get("saga") || searchParams.get("category");

  // Default selected universe/saga is "Infinity Saga" as requested
  const [selectedSaga, setSelectedSaga] = useState(sagaParam || "Infinity Saga");
  const [selectedPhase, setSelectedPhase] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [watchOrderMode, setWatchOrderMode] = useState("chronologicalOrder"); // 'chronologicalOrder' | 'releaseOrder'
  const [mcuList, setMcuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState(null);

  // Sync state if URL search query changes
  useEffect(() => {
    if (sagaParam) {
      setSelectedSaga(sagaParam);
    }
  }, [sagaParam]);

  // Fetch media when filters change
  useEffect(() => {
    fetchMarvelMedia();
  }, [selectedSaga, selectedPhase, selectedType, watchOrderMode]);

  const fetchMarvelMedia = async () => {
    setLoading(true);
    try {
      let url = `/api/media?isMCU=true&sortBy=${watchOrderMode}`;
      if (selectedSaga !== "All") {
        url += `&saga=${encodeURIComponent(selectedSaga)}`;
      }
      if (selectedPhase !== "All") {
        url += `&phase=${encodeURIComponent(selectedPhase)}`;
      }
      if (selectedType !== "All") {
        url += `&type=${encodeURIComponent(selectedType)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMcuList(data);
        if (data.length > 0) {
          setActiveMedia(data[0]);
        } else {
          setActiveMedia(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch Marvel media", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSagaChange = (sagaId) => {
    setSelectedSaga(sagaId);
    setSelectedPhase("All");
    router.push(`/marvel?saga=${encodeURIComponent(sagaId)}`, { scroll: false });
  };

  const activeUniverseObj = MARVEL_UNIVERSES.find((u) => u.id === selectedSaga) || MARVEL_UNIVERSES[0];

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white selection:bg-red-600 selection:text-white font-sans">
      <Navbar />

      {/* Top Header Banner */}
      <div className="pt-20 px-4 md:px-12 bg-gradient-to-b from-[#1c0407] via-[#0f0708] to-[#0b0c10] border-b border-red-900/30">
        <div className="max-w-7xl mx-auto py-6 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#E62429] text-white font-black text-xs px-2.5 py-0.5 tracking-widest rounded shadow-[0_0_10px_rgba(230,36,41,0.6)]">
                  MARVEL STUDIOS
                </span>
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Timeline & Multiverse Experience
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-100 to-red-400 uppercase drop-shadow-[0_2px_10px_rgba(230,36,41,0.3)]">
                Marvel Cinematic & Multiverse
              </h1>
            </div>

            {/* Watch Order Toggle */}
            <div className="bg-red-950/40 p-1.5 rounded-xl border border-red-700/40 flex items-center gap-1 backdrop-blur-md shadow-lg shrink-0">
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

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SAGA / UNIVERSE FILTER TABS BAR (Horizontal Pill Selector)    */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-red-900/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-red-500" /> Select Marvel Universe / Saga
              </span>
              <span className="text-[11px] text-red-400 font-semibold hidden sm:inline">
                Active: <strong className="text-white">{selectedSaga === "All" ? "All Marvel Titles" : selectedSaga}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
              {MARVEL_UNIVERSES.map((u) => {
                const isActive = selectedSaga === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSagaChange(u.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 flex items-center gap-2 border shrink-0 ${
                      isActive
                        ? "bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white border-red-400 shadow-[0_0_15px_rgba(230,36,41,0.6)] scale-[1.03]"
                        : "bg-[#12141c]/90 text-gray-300 hover:text-white hover:bg-red-950/40 border-gray-800 hover:border-red-900/60"
                    }`}
                  >
                    <span>{u.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                        isActive
                          ? "bg-white text-red-700"
                          : "bg-gray-800 text-gray-400 group-hover:text-gray-200"
                      }`}
                    >
                      {u.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PHASE FILTER & FORMAT FILTER BAR                              */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12141c] p-3.5 rounded-2xl border border-red-900/30 shadow-lg">
            
            {/* Phase Filters (Only visible if Infinity Saga or Multiverse Saga is selected) */}
            {activeUniverseObj?.hasPhases ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest shrink-0 flex items-center gap-1 mr-1">
                  <Shield className="w-3.5 h-3.5 text-red-500" /> Phase Filter:
                </span>
                {activeUniverseObj.phases.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPhase(p)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      selectedPhase === p
                        ? "bg-red-600 text-white shadow-[0_0_10px_rgba(230,36,41,0.5)] border border-red-400"
                        : "bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-semibold flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>Phase filter not applicable for {selectedSaga}</span>
              </div>
            )}

            {/* Format Type Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Format:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-900 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-red-500"
              >
                <option value="All">All Formats</option>
                <option value="Movie">Movies Only</option>
                <option value="Series">Series Only</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Featured Media Hero Banner (if activeMedia exists) */}
      {activeMedia && (
        <div className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden border-b border-red-900/20">
          <img
            src={activeMedia.bannerUrl || activeMedia.thumbnailUrl}
            alt={activeMedia.title}
            className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/70 to-transparent" />

          <div className="absolute bottom-8 left-4 md:left-12 max-w-2xl z-10 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {activeMedia.mcuPhase && activeMedia.mcuPhase !== "Other" && (
                <span className="bg-red-600/90 text-white font-extrabold text-xs px-3 py-1 rounded tracking-wider uppercase border border-red-400/50 shadow-[0_0_10px_rgba(230,36,41,0.5)]">
                  {activeMedia.mcuPhase}
                </span>
              )}
              {activeMedia.mcuSaga && (
                <span className="bg-amber-950/80 text-amber-300 font-bold text-xs px-3 py-1 rounded border border-amber-600/40">
                  {activeMedia.mcuSaga}
                </span>
              )}
              <span className="bg-gray-900/90 text-gray-200 text-xs px-2.5 py-1 rounded border border-gray-700">
                {activeMedia.type}
              </span>
              <span className="text-yellow-400 font-black text-xs">
                #{mcuList.findIndex((m) => m._id === activeMedia._id) + 1} IN FILTERED SELECTION
              </span>
            </div>

            <h2 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tight line-clamp-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {activeMedia.title}
            </h2>

            <p className="text-gray-300 text-xs md:text-sm line-clamp-2 leading-relaxed max-w-xl">
              {activeMedia.description}
            </p>

            <div className="flex items-center gap-4 pt-1">
              <Link
                href={`/watch/${activeMedia._id}`}
                className="bg-[#E62429] hover:bg-red-700 text-white px-7 py-2.5 rounded-lg font-extrabold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 transition transform hover:scale-105 shadow-[0_0_25px_rgba(230,36,41,0.6)]"
              >
                <Play className="w-4 h-4 fill-current" /> Stream Movie
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TIMELINE MEDIA GRID & DYNAMIC NUMBERING                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-red-500" />
            <h3 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-white">
              {selectedSaga === "All" ? "All Marvel Titles" : selectedSaga} ({watchOrderMode === "chronologicalOrder" ? "Chronological Timeline" : "Release Order View"})
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-semibold bg-gray-900 px-3 py-1 rounded-md border border-gray-800">
            {mcuList.length} {mcuList.length === 1 ? "Title" : "Titles"} Found
          </span>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Timeline...</p>
          </div>
        ) : mcuList.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 bg-[#12141c] rounded-2xl border border-red-900/30 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-red-950/60 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/30">
              <Film className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">No Titles Found for {selectedSaga}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use the Admin Dashboard to add titles assigned to <strong>{selectedSaga}</strong>, or seed starter Marvel presets!
            </p>
            <Link
              href="/admin"
              className="inline-block bg-[#E62429] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg transition shadow-[0_0_15px_rgba(230,36,41,0.5)]"
            >
              Open Admin Uploader
            </Link>
          </div>
        ) : (
          /* Timeline Media Grid with Dynamic Filter Renumbering starting at #1 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mcuList.map((item, index) => {
              // DYNAMIC RENUMBERING: Restart numbering from #1 for currently displayed list
              const dynamicNumber = index + 1;
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

                    {/* Dynamic Order Badge (#1, #2, #3...) */}
                    <div className="absolute top-2 left-2 bg-[#E62429] text-white font-black text-xs px-2.5 py-1 rounded shadow-lg tracking-wider">
                      #{dynamicNumber}
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
                        <span className="text-red-400">{item.mcuPhase && item.mcuPhase !== "Other" ? item.mcuPhase : item.mcuSaga}</span>
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

export default function MarvelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MarvelContent />
    </Suspense>
  );
}
