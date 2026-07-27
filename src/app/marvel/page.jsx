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
  ArrowLeft,
  Tv,
  ListOrdered,
  ChevronRight,
  Zap,
  Flame,
  Globe,
  Layers,
  Star,
  Clapperboard
} from "lucide-react";
import Navbar from "@/components/Navbar";

const MARVEL_CATEGORIES = [
  {
    id: "Infinity Saga",
    title: "Infinity Saga",
    subtitle: "Phases 1 - 3",
    description: "The foundational era of the MCU leading up to Endgame.",
    accent: "from-amber-600 via-red-600 to-amber-900",
    border: "border-amber-500/40 hover:border-amber-400",
    badge: "Phases 1-3",
    hasPhases: true,
    phases: ["All", "Phase 1", "Phase 2", "Phase 3"],
    icon: Star,
  },
  {
    id: "Multiverse Saga",
    title: "Multiverse Saga",
    subtitle: "Phases 4 - 6",
    description: "Alternate realities, timeline variants, and secret wars.",
    accent: "from-purple-600 via-indigo-600 to-blue-900",
    border: "border-purple-500/40 hover:border-purple-400",
    badge: "Phases 4-6",
    hasPhases: true,
    phases: ["All", "Phase 4", "Phase 5", "Phase 6"],
    icon: Layers,
  },
  {
    id: "X-Men Universe",
    title: "X-Men Universe",
    subtitle: "Mutant Saga",
    description: "Wolverine, Professor X, and the saga of Mutantkind.",
    accent: "from-blue-600 via-cyan-600 to-slate-900",
    border: "border-blue-500/40 hover:border-blue-400",
    badge: "Mutant Universe",
    hasPhases: false,
    phases: [],
    icon: Zap,
  },
  {
    id: "Sony Spider-Man Universe",
    title: "Sony Spider-Man Universe",
    subtitle: "Web-Slingers & Symbiotes",
    description: "Spider-Man, Venom, Morbius, and the Spider-Verse.",
    accent: "from-red-600 via-rose-700 to-zinc-950",
    border: "border-red-500/40 hover:border-red-400",
    badge: "Spider-Verse",
    hasPhases: false,
    phases: [],
    icon: Globe,
  },
  {
    id: "Fantastic Four",
    title: "Fantastic Four",
    subtitle: "Marvel's First Family",
    description: "Reed Richards, Sue Storm, Johnny Storm, and Ben Grimm.",
    accent: "from-sky-600 via-blue-700 to-indigo-950",
    border: "border-sky-500/40 hover:border-sky-400",
    badge: "First Family",
    hasPhases: false,
    phases: [],
    icon: Shield,
  },
  {
    id: "Blade",
    title: "Blade",
    subtitle: "Daywalker Trilogy",
    description: "The iconic vampire hunter operating in the shadows.",
    accent: "from-red-900 via-zinc-900 to-black",
    border: "border-red-700/40 hover:border-red-600",
    badge: "Daywalker",
    hasPhases: false,
    phases: [],
    icon: Flame,
  },
  {
    id: "Ghost Rider",
    title: "Ghost Rider",
    subtitle: "Spirit of Vengeance",
    description: "Johnny Blaze and hellfire-fueled vigilante justice.",
    accent: "from-orange-600 via-red-700 to-neutral-950",
    border: "border-orange-500/40 hover:border-orange-400",
    badge: "Hellfire",
    hasPhases: false,
    phases: [],
    icon: Flame,
  },
  {
    id: "Daredevil & Elektra",
    title: "Daredevil & Elektra",
    subtitle: "Hell's Kitchen Legends",
    description: "The Man Without Fear and the lethal assassin.",
    accent: "from-rose-800 via-red-950 to-black",
    border: "border-rose-600/40 hover:border-rose-500",
    badge: "Vigilantes",
    hasPhases: false,
    phases: [],
    icon: Shield,
  },
  {
    id: "Punisher",
    title: "Punisher",
    subtitle: "War Zone",
    description: "Frank Castle's uncompromising war on crime.",
    accent: "from-slate-700 via-zinc-800 to-black",
    border: "border-slate-500/40 hover:border-slate-400",
    badge: "War Zone",
    hasPhases: false,
    phases: [],
    icon: Clapperboard,
  },
  {
    id: "Hulk",
    title: "Hulk",
    subtitle: "Gamma Classics",
    description: "Classic standalone Gamma-irradiated monster chronicles.",
    accent: "from-emerald-700 via-green-800 to-zinc-950",
    border: "border-emerald-500/40 hover:border-emerald-400",
    badge: "Gamma",
    hasPhases: false,
    phases: [],
    icon: Zap,
  },
  {
    id: "Other Marvel Movies",
    title: "Other Marvel Movies",
    subtitle: "Special Collections",
    description: "Standalone Marvel titles, specials, and adaptations.",
    accent: "from-gray-700 via-red-900 to-black",
    border: "border-gray-500/40 hover:border-gray-400",
    badge: "Specials",
    hasPhases: false,
    phases: [],
    icon: Film,
  },
];

function MarvelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategoryParam = searchParams.get("category") || searchParams.get("saga");

  const [selectedCategory, setSelectedCategory] = useState(activeCategoryParam || null);
  const [mcuList, setMcuList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchOrderMode, setWatchOrderMode] = useState("chronologicalOrder"); // 'chronologicalOrder' | 'releaseOrder'
  const [selectedPhase, setSelectedPhase] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [activeMedia, setActiveMedia] = useState(null);

  // Sync state if URL query parameter changes
  useEffect(() => {
    if (activeCategoryParam) {
      setSelectedCategory(activeCategoryParam);
    } else {
      setSelectedCategory(null);
    }
  }, [activeCategoryParam]);

  // Fetch items when a category or filter changes
  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryMedia();
    }
  }, [selectedCategory, watchOrderMode, selectedPhase, selectedType]);

  const fetchCategoryMedia = async () => {
    setLoading(true);
    try {
      let url = `/api/media?isMCU=true&sortBy=${watchOrderMode}`;
      if (selectedCategory) {
        url += `&saga=${encodeURIComponent(selectedCategory)}`;
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

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setSelectedPhase("All");
    setSelectedType("All");
    router.push(`/marvel?category=${encodeURIComponent(catId)}`);
  };

  const handleBackToLanding = () => {
    setSelectedCategory(null);
    setSelectedPhase("All");
    setSelectedType("All");
    setMcuList([]);
    setActiveMedia(null);
    router.push("/marvel");
  };

  const activeCategoryObj = MARVEL_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white selection:bg-red-600 selection:text-white font-sans">
      <Navbar />

      {/* Hero Header */}
      <div className="pt-20 px-4 md:px-12 bg-gradient-to-b from-[#1c0407] via-[#0f0708] to-[#0b0c10] border-b border-red-900/30">
        <div className="max-w-7xl mx-auto py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              {/* Breadcrumb & Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#E62429] text-white font-black text-xs px-2.5 py-0.5 tracking-widest rounded shadow-[0_0_10px_rgba(230,36,41,0.6)]">
                  MARVEL STUDIOS
                </span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" /> Dynamic Universe Explorer
                </span>

                {selectedCategory && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 ml-1">
                    <ChevronRight className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-red-400 font-bold">{selectedCategory}</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-100 to-red-400 uppercase drop-shadow-[0_2px_10px_rgba(230,36,41,0.3)]">
                {selectedCategory ? selectedCategory : "Marvel Cinematic & Multiverse"}
              </h1>

              <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
                {selectedCategory
                  ? activeCategoryObj?.description || "Explore complete viewing orders and phases."
                  : "Select a saga or universe below to explore the official release & chronological timelines."}
              </p>
            </div>

            {/* Back Button if in Category View */}
            {selectedCategory && (
              <button
                onClick={handleBackToLanding}
                className="flex items-center gap-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg backdrop-blur-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to All Marvel Universes
              </button>
            )}
          </div>

          {/* Viewing Order Controls (when Category is Selected) */}
          {selectedCategory && (
            <div className="mt-6 pt-4 border-t border-red-900/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-red-950/40 p-1.5 rounded-xl border border-red-700/40 backdrop-blur-md">
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

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Format:</span>
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
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. MARVEL LANDING PAGE GRID (Shown when no category is selected) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!selectedCategory && (
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-12 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" /> Marvel Universes & Sagas
              </h2>
              <p className="text-xs text-gray-400">Choose a universe or saga to enter its timeline experience</p>
            </div>
            <span className="text-xs text-red-400 font-bold bg-red-950/60 px-3 py-1 rounded-full border border-red-500/30">
              {MARVEL_CATEGORIES.length} Categories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {MARVEL_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`group relative bg-gradient-to-b ${cat.accent} rounded-2xl p-6 border ${cat.border} transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(230,36,41,0.3)] cursor-pointer flex flex-col justify-between overflow-hidden min-h-[220px]`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/10">
                        {cat.badge}
                      </span>
                      <IconComp className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>

                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-yellow-200 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-gray-200/80 font-medium mt-1">
                      {cat.subtitle}
                    </p>
                    <p className="text-xs text-gray-300/70 mt-3 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                    <span>Explore Universe</span>
                    <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-white transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. CATEGORY MOVIE LIST & TIMELINE VIEW (Shown when category selected) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedCategory && (
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-8">

          {/* Conditional Phase Filter Bar (Only displayed for Infinity Saga & Multiverse Saga) */}
          {activeCategoryObj?.hasPhases && activeCategoryObj.phases.length > 0 && (
            <div className="bg-[#12141c] p-4 rounded-2xl border border-red-900/30 shadow-xl space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-red-500" /> Filter Phase
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {activeCategoryObj.phases.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPhase(p)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedPhase === p
                        ? "bg-[#E62429] text-white shadow-[0_0_12px_rgba(230,36,41,0.6)] border border-red-400"
                        : "bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Featured Hero Banner for Category (Active Media) */}
          {activeMedia && (
            <div className="relative w-full h-[40vh] md:h-[50vh] rounded-2xl overflow-hidden border border-red-900/30 shadow-2xl">
              <img
                src={activeMedia.bannerUrl || activeMedia.thumbnailUrl}
                alt={activeMedia.title}
                className="w-full h-full object-cover object-center filter brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/80 to-transparent" />

              <div className="absolute bottom-6 left-6 md:left-10 max-w-xl z-10 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeMedia.mcuPhase && activeMedia.mcuPhase !== "Other" && (
                    <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded uppercase border border-red-400/50">
                      {activeMedia.mcuPhase}
                    </span>
                  )}
                  <span className="bg-gray-900/90 text-gray-200 text-xs px-2.5 py-0.5 rounded border border-gray-700">
                    {activeMedia.type}
                  </span>
                  <span className="text-yellow-400 font-black text-xs">
                    #{mcuList.findIndex(m => m._id === activeMedia._id) + 1} IN FILTERED SELECTION
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight line-clamp-2">
                  {activeMedia.title}
                </h2>

                <p className="text-gray-300 text-xs md:text-sm line-clamp-2 leading-relaxed">
                  {activeMedia.description}
                </p>

                <div className="pt-1">
                  <Link
                    href={`/watch/${activeMedia._id}`}
                    className="inline-flex bg-[#E62429] hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-extrabold text-xs md:text-sm uppercase tracking-wider items-center gap-2 transition transform hover:scale-105 shadow-[0_0_20px_rgba(230,36,41,0.6)]"
                  >
                    <Play className="w-4 h-4 fill-current" /> Stream Movie
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Section Heading with Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-red-500" />
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-wider text-white">
                {selectedCategory} Titles ({watchOrderMode === "chronologicalOrder" ? "Chronological Order" : "Release Order"})
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
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Titles...</p>
            </div>
          ) : mcuList.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-6 bg-[#12141c] rounded-2xl border border-red-900/30 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-red-950/60 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/30">
                <Film className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">No Titles in {selectedCategory} Yet</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Use the Admin Dashboard to upload titles assigned to <strong>{selectedCategory}</strong>, or seed starter Marvel titles!
              </p>
              <Link
                href="/admin"
                className="inline-block bg-[#E62429] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg transition shadow-[0_0_15px_rgba(230,36,41,0.5)]"
              >
                Open Admin Uploader
              </Link>
            </div>
          ) : (
            /* Dynamic Timeline Grid with Dynamic Renumbering */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mcuList.map((item, index) => {
                // Dynamic Filter Renumbering: restarts from #1 for whichever filtered dataset is rendered
                const dynamicOrderNumber = index + 1;
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

                      {/* Timeline Order Number Badge - DYNAMICALLY RENUMBERED FROM #1 */}
                      <div className="absolute top-2 left-2 bg-[#E62429] text-white font-black text-xs px-2.5 py-1 rounded shadow-lg tracking-wider">
                        #{dynamicOrderNumber}
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
      )}
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
