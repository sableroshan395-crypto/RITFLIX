"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Plus, Trash2, Edit, FileText, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    title: "",
    description: "",
    type: "Movie",
    genre: "",
    duration: "",
    thumbnailUrl: "",
    bannerUrl: "",
    videoSource: "",
    audioTracks: [],
    isFeatured: false,
    isMCU: false,
    mcuPhase: "Phase 1",
    mcuSaga: "Infinity Saga",
    chronologicalOrder: 1,
    releaseOrder: 1,
    seasons: [],
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "type") {
      setFormData({
        ...formData,
        [name]: value,
        seasons: value === "Movie" ? [] : [{ 
          seasonNumber: 1, 
          episodes: [{ episodeNumber: 1, title: "Episode 1", duration: "", videoSource: "", audioTracks: [] }] 
        }],
        videoSource: value !== "Movie" ? "" : formData.videoSource,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : (name === "chronologicalOrder" || name === "releaseOrder" ? (parseInt(value, 10) || 0) : value),
    });
  };

  const addSeason = () => {
    setFormData({
      ...formData,
      seasons: [
        ...formData.seasons,
        {
          seasonNumber: formData.seasons.length + 1,
          episodes: [],
        },
      ],
    });
  };

  const removeSeason = (seasonIndex) => {
    const newSeasons = formData.seasons.filter((_, i) => i !== seasonIndex);
    const adjustedSeasons = newSeasons.map((s, i) => ({
      ...s,
      seasonNumber: i + 1,
    }));
    setFormData({ ...formData, seasons: adjustedSeasons });
  };

  const addEpisode = (seasonIndex) => {
    const newSeasons = [...formData.seasons];
    const newEpNumber = newSeasons[seasonIndex].episodes.length + 1;
    newSeasons[seasonIndex].episodes.push({
      episodeNumber: newEpNumber,
      title: `Episode ${newEpNumber}`,
      duration: "",
      videoSource: "",
      audioTracks: [],
    });
    setFormData({ ...formData, seasons: newSeasons });
  };

  const removeEpisode = (seasonIndex, episodeIndex) => {
    const newSeasons = [...formData.seasons];
    newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.filter((_, i) => i !== episodeIndex);
    // Re-adjust episode numbers within this season
    newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.map((ep, i) => ({
      ...ep,
      episodeNumber: i + 1,
    }));
    setFormData({ ...formData, seasons: newSeasons });
  };

  const handleEpisodeChange = (seasonIndex, episodeIndex, field, value) => {
    const newSeasons = [...formData.seasons];
    newSeasons[seasonIndex].episodes[episodeIndex][field] = value;
    setFormData({ ...formData, seasons: newSeasons });
  };

  const addAudioTrack = () => {
    setFormData({
      ...formData,
      audioTracks: [...(formData.audioTracks || []), { name: "", lang: "", url: "", default: false }],
    });
  };

  const removeAudioTrack = (index) => {
    const newTracks = [...formData.audioTracks];
    newTracks.splice(index, 1);
    setFormData({ ...formData, audioTracks: newTracks });
  };

  const handleAudioTrackChange = (index, field, value) => {
    const newTracks = [...formData.audioTracks];
    if (field === "default" && value === true) {
      newTracks.forEach(t => t.default = false);
    }
    newTracks[index][field] = value;
    setFormData({ ...formData, audioTracks: newTracks });
  };

  const addEpisodeAudioTrack = (seasonIndex, episodeIndex) => {
    const newSeasons = [...formData.seasons];
    if (!newSeasons[seasonIndex].episodes[episodeIndex].audioTracks) {
      newSeasons[seasonIndex].episodes[episodeIndex].audioTracks = [];
    }
    newSeasons[seasonIndex].episodes[episodeIndex].audioTracks.push({ name: "", lang: "", url: "", default: false });
    setFormData({ ...formData, seasons: newSeasons });
  };

  const removeEpisodeAudioTrack = (seasonIndex, episodeIndex, trackIndex) => {
    const newSeasons = [...formData.seasons];
    newSeasons[seasonIndex].episodes[episodeIndex].audioTracks.splice(trackIndex, 1);
    setFormData({ ...formData, seasons: newSeasons });
  };

  const handleEpisodeAudioTrackChange = (seasonIndex, episodeIndex, trackIndex, field, value) => {
    const newSeasons = [...formData.seasons];
    const tracks = newSeasons[seasonIndex].episodes[episodeIndex].audioTracks;
    if (field === "default" && value === true) {
      tracks.forEach(t => t.default = false);
    }
    tracks[trackIndex][field] = value;
    setFormData({ ...formData, seasons: newSeasons });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      type: item.type || "Movie",
      genre: item.genre || "",
      duration: item.duration || "",
      thumbnailUrl: item.thumbnailUrl || "",
      bannerUrl: item.bannerUrl || "",
      videoSource: item.videoSource || "",
      audioTracks: item.audioTracks || [],
      isFeatured: item.isFeatured || false,
      isMCU: item.isMCU || false,
      mcuPhase: item.mcuPhase || "Phase 1",
      mcuSaga: item.mcuSaga || "The Infinity Saga",
      chronologicalOrder: item.chronologicalOrder || 1,
      releaseOrder: item.releaseOrder || 1,
      seasons: item.seasons || [],
    });
    setActiveTab("add");
    setMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (formData.type !== "Movie") {
      if (formData.seasons.length === 0) {
        setMessage("Error: Series/Anime must have at least one season.");
        setLoading(false);
        return;
      }
      for (const season of formData.seasons) {
        if (season.episodes.length === 0) {
          setMessage(`Error: Season ${season.seasonNumber} must have at least one episode.`);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const payload = { ...formData };
      if (payload.type === "Movie") {
        delete payload.seasons;
      } else {
        delete payload.videoSource;
      }

      const url = editingId ? `/api/media/${editingId}` : "/api/media";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage(editingId ? "Media updated successfully!" : "Media added successfully!");
        setFormData(initialFormState);
        if (editingId) setEditingId(null);
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error || "Failed to save media"}`);
      }
    } catch (error) {
      setMessage("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [activeTab, setActiveTab] = useState("add"); 
  const [mediaList, setMediaList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // ── Bulk Import state ────────────────────────────────────────────────────
  const [bulkImportOpen, setBulkImportOpen] = useState(null); // seasonIndex or null
  const [bulkVideoUrls, setBulkVideoUrls] = useState("");
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState("Episode");
  const [bulkStartNum, setBulkStartNum] = useState(1);
  const [bulkSharedAudio, setBulkSharedAudio] = useState([]);
  const [batchCount, setBatchCount] = useState(5);

  const addBulkSharedAudio = () => {
    setBulkSharedAudio(prev => [...prev, { name: "", lang: "", url: "", default: prev.length === 0 }]);
  };

  const removeBulkSharedAudio = (idx) => {
    setBulkSharedAudio(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBulkSharedAudioChange = (idx, field, value) => {
    setBulkSharedAudio(prev => {
      const updated = [...prev];
      if (field === "default" && value === true) {
        updated.forEach(t => t.default = false);
      }
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleBulkImport = (seasonIndex) => {
    const lines = bulkVideoUrls.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const newSeasons = [...formData.seasons];
    const existingCount = newSeasons[seasonIndex].episodes.length;
    const startNum = parseInt(bulkStartNum, 10) || (existingCount + 1);

    const newEpisodes = lines.map((url, i) => ({
      episodeNumber: existingCount + i + 1,
      title: `${bulkTitlePrefix} ${startNum + i}`,
      duration: "",
      videoSource: url,
      audioTracks: bulkSharedAudio.length > 0
        ? bulkSharedAudio.map(t => ({ ...t }))
        : [],
    }));

    newSeasons[seasonIndex].episodes = [
      ...newSeasons[seasonIndex].episodes,
      ...newEpisodes,
    ];

    setFormData({ ...formData, seasons: newSeasons });
    setBulkImportOpen(null);
    setBulkVideoUrls("");
    setBulkSharedAudio([]);
    setBulkTitlePrefix("Episode");
    setBulkStartNum(existingCount + 1);
  };

  const handleBatchAdd = (seasonIndex) => {
    const count = parseInt(batchCount, 10);
    if (!count || count < 1) return;

    const newSeasons = [...formData.seasons];
    const existingCount = newSeasons[seasonIndex].episodes.length;

    for (let i = 0; i < count; i++) {
      newSeasons[seasonIndex].episodes.push({
        episodeNumber: existingCount + i + 1,
        title: `Episode ${existingCount + i + 1}`,
        duration: "",
        videoSource: "",
        audioTracks: [],
      });
    }

    setFormData({ ...formData, seasons: newSeasons });
  };

  const fetchMediaList = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (error) {
      console.error("Failed to fetch media list", error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this media? This action cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMediaList(mediaList.filter(item => item._id !== id));
      } else {
        alert("Failed to delete media.");
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleSeedMcuPresets = async () => {
    if (!window.confirm("Seed starter MCU titles (Captain America, Captain Marvel, Iron Man, Loki) into your database?")) return;
    setLoading(true);
    setMessage("Seeding starter MCU titles...");
    try {
      const presets = [
        {
          title: "Captain America: The First Avenger",
          description: "Steve Rogers, a rejected military soldier, transforms into Captain America after taking a dose of a 'Super-Soldier serum'. But being Captain America comes at a price as he attempts to take down a war mongering organization.",
          type: "Movie",
          genre: "Action/Sci-Fi",
          duration: "2h 4m",
          thumbnailUrl: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1000",
          bannerUrl: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1200",
          videoSource: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          isMCU: true,
          mcuPhase: "Phase 1",
          mcuSaga: "The Infinity Saga",
          chronologicalOrder: 1,
          releaseOrder: 5,
        },
        {
          title: "Captain Marvel",
          description: "Carol Danvers becomes one of the universe's most powerful heroes when Earth is caught in the middle of a galactic war between two alien races.",
          type: "Movie",
          genre: "Action/Sci-Fi",
          duration: "2h 4m",
          thumbnailUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000",
          bannerUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200",
          videoSource: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          isMCU: true,
          mcuPhase: "Phase 3",
          mcuSaga: "The Infinity Saga",
          chronologicalOrder: 2,
          releaseOrder: 21,
        },
        {
          title: "Iron Man",
          description: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique armored suit to fight evil.",
          type: "Movie",
          genre: "Action/Sci-Fi",
          duration: "2h 6m",
          thumbnailUrl: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?q=80&w=1000",
          bannerUrl: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?q=80&w=1200",
          videoSource: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          isMCU: true,
          mcuPhase: "Phase 1",
          mcuSaga: "The Infinity Saga",
          chronologicalOrder: 3,
          releaseOrder: 1,
        },
        {
          title: "Loki",
          description: "The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of 'Avengers: Endgame'.",
          type: "Series",
          genre: "Sci-Fi/Fantasy",
          thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000",
          bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200",
          isMCU: true,
          mcuPhase: "Phase 4",
          mcuSaga: "The Multiverse Saga",
          chronologicalOrder: 24,
          releaseOrder: 24,
          seasons: [
            {
              seasonNumber: 1,
              episodes: [
                {
                  episodeNumber: 1,
                  title: "Glorious Purpose",
                  duration: "51m",
                  videoSource: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                },
                {
                  episodeNumber: 2,
                  title: "The Variant",
                  duration: "54m",
                  videoSource: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                }
              ]
            }
          ]
        }
      ];

      for (const p of presets) {
        await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
      }
      setMessage("Success: Starter MCU titles seeded successfully!");
      if (activeTab === "manage") fetchMediaList();
    } catch (err) {
      setMessage("Error seeding MCU presets.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (passcode === "Ac80m4a1") {
      setIsAuthenticated(true);
      setPasscodeError("");
    } else {
      setPasscodeError("Incorrect passcode. Access denied.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center">
        <Navbar />
        <div className="bg-[#181818] p-8 rounded-lg shadow-xl border border-gray-800 w-full max-w-md z-10 mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center text-primary">Admin Access Required</h2>
          {passcodeError && <p className="text-red-500 mb-4 text-center text-sm">{passcodeError}</p>}
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Passcode"
                className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary text-center tracking-widest"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-4 rounded transition"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      
      <main className="pt-24 px-4 md:px-12 max-w-4xl mx-auto pb-12">
        <h1 className="text-3xl font-bold mb-8 text-primary">Admin Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-2">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab("add");
                if (!editingId) setFormData(initialFormState);
              }}
              className={`pb-2 px-4 font-semibold transition-colors ${activeTab === "add" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}
            >
              {editingId ? "Edit Content" : "Add Content"}
            </button>
            <button
              onClick={() => {
                setActiveTab("manage");
                fetchMediaList();
              }}
              className={`pb-2 px-4 font-semibold transition-colors ${activeTab === "manage" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}
            >
              Manage Content
            </button>
          </div>

          <button
            type="button"
            onClick={handleSeedMcuPresets}
            className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900 border border-red-600/50 text-red-300 hover:text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md self-start sm:self-auto"
          >
            <span className="bg-red-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">MCU</span>
            Seed Starter MCU Presets
          </button>
        </div>

        <div className="bg-[#181818] p-6 md:p-8 rounded-lg shadow-xl border border-gray-800 min-h-[500px]">
          {activeTab === "add" ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{editingId ? "Edit Content" : "Add New Content"}</h2>
                {editingId && (
                  <button 
                    onClick={cancelEdit}
                    className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              
              {message && (
                <div className={`p-4 mb-6 rounded ${message.includes("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Inception"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Movie">Movie</option>
                      <option value="Series">Series</option>
                      <option value="Anime">Anime</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      value={formData.genre}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Action, Sci-Fi"
                    />
                  </div>

                  {formData.type === "Movie" && (
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Duration (Optional)</label>
                      <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. 1h 45m"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2 flex flex-col justify-end pb-3 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleChange}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                      Feature on Hero Carousel
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-red-500 bg-red-950/40 p-2 rounded border border-red-700/40">
                      <input
                        type="checkbox"
                        name="isMCU"
                        checked={formData.isMCU}
                        onChange={handleChange}
                        className="w-5 h-5 accent-red-600 cursor-pointer"
                      />
                      <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black">MARVEL</span>
                      Add to Dedicated Marvel Section
                    </label>
                  </div>
                </div>

                {/* Marvel Additional Metadata Box */}
                {formData.isMCU && (
                  <div className="bg-[#1b080a] border border-red-800/60 p-4 rounded-xl space-y-4 shadow-lg">
                    <h4 className="text-sm font-black uppercase text-red-400 tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                      Marvel Universe & Timeline Settings
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300">Marvel Phase (Optional)</label>
                        <select
                          name="mcuPhase"
                          value={formData.mcuPhase}
                          onChange={handleChange}
                          className="w-full bg-[#2a2a2a] text-white p-2.5 rounded border border-red-900/60 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        >
                          <option value="Phase 1">Phase 1</option>
                          <option value="Phase 2">Phase 2</option>
                          <option value="Phase 3">Phase 3</option>
                          <option value="Phase 4">Phase 4</option>
                          <option value="Phase 5">Phase 5</option>
                          <option value="Phase 6">Phase 6</option>
                          <option value="Other">Other / None</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300">Marvel Universe / Saga</label>
                        <select
                          name="mcuSaga"
                          value={formData.mcuSaga}
                          onChange={handleChange}
                          className="w-full bg-[#2a2a2a] text-white p-2.5 rounded border border-red-900/60 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        >
                          <option value="Infinity Saga">Infinity Saga</option>
                          <option value="Multiverse Saga">Multiverse Saga</option>
                          <option value="X-Men Universe">X-Men Universe</option>
                          <option value="Sony Spider-Man Universe">Sony Spider-Man Universe</option>
                          <option value="Fantastic Four">Fantastic Four</option>
                          <option value="Blade">Blade</option>
                          <option value="Ghost Rider">Ghost Rider</option>
                          <option value="Daredevil & Elektra">Daredevil & Elektra</option>
                          <option value="Punisher">Punisher</option>
                          <option value="Hulk">Hulk</option>
                          <option value="Other Marvel Movies">Other Marvel Movies</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300">Chronological Rank (#)</label>
                        <input
                          type="number"
                          name="chronologicalOrder"
                          value={formData.chronologicalOrder}
                          onChange={handleChange}
                          min="1"
                          className="w-full bg-[#2a2a2a] text-white p-2.5 rounded border border-red-900/60 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          placeholder="e.g. 1"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300">Release Rank (#)</label>
                        <input
                          type="number"
                          name="releaseOrder"
                          value={formData.releaseOrder}
                          onChange={handleChange}
                          min="1"
                          className="w-full bg-[#2a2a2a] text-white p-2.5 rounded border border-red-900/60 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          placeholder="e.g. 1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Synopsis..."
                  ></textarea>
                </div>

                {formData.type === "Movie" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Video Source URL (Embed or Direct Link)</label>
                      <input
                        type="text"
                        name="videoSource"
                        value={formData.videoSource}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                    
                    <div className="border border-gray-700 p-4 rounded-lg bg-[#141414] space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <h3 className="text-sm font-medium text-gray-200">Audio Tracks (Optional)</h3>
                        <button
                          type="button"
                          onClick={addAudioTrack}
                          className="flex items-center gap-1 text-xs bg-[#2a2a2a] hover:bg-gray-700 px-2 py-1 rounded transition text-gray-300"
                        >
                          <Plus className="w-3 h-3" /> Add Track
                        </button>
                      </div>
                      {(formData.audioTracks || []).map((track, trackIdx) => (
                        <div key={trackIdx} className="flex flex-col gap-2 p-3 bg-[#1e1e1e] rounded border border-gray-800 relative">
                           <button type="button" onClick={() => removeAudioTrack(trackIdx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pr-6">
                             <input type="text" placeholder="Name (e.g. English)" value={track.name} onChange={(e) => handleAudioTrackChange(trackIdx, "name", e.target.value)} required className="bg-[#2a2a2a] text-white p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                             <input type="text" placeholder="Lang (e.g. en)" value={track.lang} onChange={(e) => handleAudioTrackChange(trackIdx, "lang", e.target.value)} className="bg-[#2a2a2a] text-white p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                             <input type="text" placeholder="URL (.m3u8)" value={track.url} onChange={(e) => handleAudioTrackChange(trackIdx, "url", e.target.value)} required className="md:col-span-2 bg-[#2a2a2a] text-white p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                           </div>
                           <label className="flex items-center gap-2 text-sm text-gray-400 mt-1 cursor-pointer w-max">
                             <input type="checkbox" checked={track.default} onChange={(e) => handleAudioTrackChange(trackIdx, "default", e.target.checked)} className="accent-primary w-4 h-4 cursor-pointer" />
                             Set as default track
                           </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 border border-gray-700 p-4 rounded-lg bg-[#141414]">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                      <h3 className="text-lg font-medium text-gray-200">Seasons Builder</h3>
                      <button
                        type="button"
                        onClick={addSeason}
                        className="flex items-center gap-1 text-sm bg-primary hover:bg-primary/80 px-3 py-1.5 rounded transition font-semibold"
                      >
                        <Plus className="w-4 h-4" /> Add Season
                      </button>
                    </div>
                    
                    {formData.seasons.length === 0 && (
                      <p className="text-gray-500 text-sm">No seasons added yet.</p>
                    )}

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                      {formData.seasons.map((season, seasonIndex) => (
                        <div key={seasonIndex} className="bg-[#1a1a1a] p-4 rounded border border-gray-700">
                          
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                            <h4 className="font-bold text-white text-lg">Season {season.seasonNumber}</h4>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setBulkImportOpen(seasonIndex);
                                  setBulkStartNum(season.episodes.length + 1);
                                }}
                                className="flex items-center gap-1 text-sm bg-green-600/20 hover:bg-green-600/40 text-green-400 px-3 py-1 rounded transition border border-green-600/30"
                                title="Bulk import episodes from pasted URLs"
                              >
                                <Zap className="w-4 h-4" /> Bulk Import
                              </button>
                              <button
                                type="button"
                                onClick={() => addEpisode(seasonIndex)}
                                className="flex items-center gap-1 text-sm bg-[#2a2a2a] hover:bg-gray-700 px-3 py-1 rounded transition text-gray-300"
                              >
                                <Plus className="w-4 h-4" /> Add Episode
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSeason(seasonIndex)}
                                className="text-gray-500 hover:text-red-500 transition"
                                title="Delete Season"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {season.episodes.length === 0 && (
                              <p className="text-sm text-gray-500 italic">No episodes in Season {season.seasonNumber} yet.</p>
                            )}
                            {season.episodes.map((ep, episodeIndex) => (
                              <div key={episodeIndex} className="flex flex-col gap-2 p-3 bg-[#1e1e1e] rounded border border-gray-800">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-gray-400 text-sm">Episode {ep.episodeNumber}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeEpisode(seasonIndex, episodeIndex)}
                                    className="text-gray-600 hover:text-red-500 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <input
                                    type="text"
                                    value={ep.title}
                                    onChange={(e) => handleEpisodeChange(seasonIndex, episodeIndex, "title", e.target.value)}
                                    placeholder="Episode Title"
                                    required
                                    className="w-full bg-[#2a2a2a] text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm md:col-span-1"
                                  />
                                  <input
                                    type="text"
                                    value={ep.duration}
                                    onChange={(e) => handleEpisodeChange(seasonIndex, episodeIndex, "duration", e.target.value)}
                                    placeholder="Duration (e.g. 24m)"
                                    className="w-full bg-[#2a2a2a] text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={ep.videoSource}
                                    onChange={(e) => handleEpisodeChange(seasonIndex, episodeIndex, "videoSource", e.target.value)}
                                    placeholder="Video URL"
                                    required
                                    className="w-full bg-[#2a2a2a] text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm md:col-span-3"
                                  />
                                </div>
                                <div className="mt-2 pl-2 border-l-2 border-gray-700 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-medium">Audio Tracks</span>
                                    <button
                                      type="button"
                                      onClick={() => addEpisodeAudioTrack(seasonIndex, episodeIndex)}
                                      className="text-xs text-primary hover:text-white transition flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> Add Track
                                    </button>
                                  </div>
                                  {(ep.audioTracks || []).map((track, trackIdx) => (
                                    <div key={trackIdx} className="flex items-center gap-2 bg-[#141414] p-2 rounded border border-gray-800">
                                      <input type="text" placeholder="Name" value={track.name} onChange={(e) => handleEpisodeAudioTrackChange(seasonIndex, episodeIndex, trackIdx, "name", e.target.value)} required className="flex-1 bg-[#2a2a2a] text-white p-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                                      <input type="text" placeholder="Lang" value={track.lang} onChange={(e) => handleEpisodeAudioTrackChange(seasonIndex, episodeIndex, trackIdx, "lang", e.target.value)} className="w-16 bg-[#2a2a2a] text-white p-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                                      <input type="text" placeholder="URL" value={track.url} onChange={(e) => handleEpisodeAudioTrackChange(seasonIndex, episodeIndex, trackIdx, "url", e.target.value)} required className="flex-[2] bg-[#2a2a2a] text-white p-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                                      <label className="flex items-center text-xs text-gray-400 gap-1 cursor-pointer">
                                        <input type="checkbox" checked={track.default} onChange={(e) => handleEpisodeAudioTrackChange(seasonIndex, episodeIndex, trackIdx, "default", e.target.checked)} className="accent-primary" /> Def
                                      </label>
                                      <button type="button" onClick={() => removeEpisodeAudioTrack(seasonIndex, episodeIndex, trackIdx)} className="text-gray-500 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Bulk Import Modal ─────────────────────────────────── */}
                {bulkImportOpen !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
                      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-green-400" />
                          Bulk Import — Season {formData.seasons[bulkImportOpen]?.seasonNumber}
                        </h3>
                        <button
                          type="button"
                          onClick={() => { setBulkImportOpen(null); setBulkVideoUrls(""); setBulkSharedAudio([]); }}
                          className="text-gray-500 hover:text-white text-xl leading-none px-2"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="bg-[#141414] border border-gray-800 rounded-lg p-4 text-xs text-gray-400 space-y-1">
                        <p className="text-gray-300 font-medium text-sm">📋 How it works:</p>
                        <p>• Paste one video URL per line below</p>
                        <p>• Each line = one episode, numbered automatically</p>
                        <p>• Optionally add shared audio tracks that apply to ALL episodes</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-400">Title Prefix</label>
                          <input
                            type="text"
                            value={bulkTitlePrefix}
                            onChange={(e) => setBulkTitlePrefix(e.target.value)}
                            className="w-full bg-[#2a2a2a] text-white p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Episode"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-400">Start Number</label>
                          <input
                            type="number"
                            min={1}
                            value={bulkStartNum}
                            onChange={(e) => setBulkStartNum(e.target.value)}
                            className="w-full bg-[#2a2a2a] text-white p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">Video URLs (one per line)</label>
                        <textarea
                          value={bulkVideoUrls}
                          onChange={(e) => setBulkVideoUrls(e.target.value)}
                          rows={8}
                          className="w-full bg-[#2a2a2a] text-white p-3 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
                          placeholder={"https://example.com/ep1.m3u8\nhttps://example.com/ep2.m3u8\nhttps://example.com/ep3.m3u8"}
                        />
                        <p className="text-xs text-gray-500">
                          {bulkVideoUrls.split("\n").filter(l => l.trim()).length} episode(s) detected
                        </p>
                      </div>

                      {/* Shared Audio Tracks */}
                      <div className="border border-gray-700 rounded-lg p-4 bg-[#141414] space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-300">Shared Audio Tracks (applied to all episodes)</span>
                          <button
                            type="button"
                            onClick={addBulkSharedAudio}
                            className="text-xs text-primary hover:text-white transition flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Track
                          </button>
                        </div>
                        {bulkSharedAudio.length === 0 && (
                          <p className="text-xs text-gray-500 italic">No shared audio tracks — episodes will have video audio only.</p>
                        )}
                        {bulkSharedAudio.map((track, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#1e1e1e] p-2 rounded border border-gray-800">
                            <input type="text" placeholder="Name (e.g. Hindi)" value={track.name} onChange={(e) => handleBulkSharedAudioChange(idx, "name", e.target.value)} className="flex-1 bg-[#2a2a2a] text-white p-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            <input type="text" placeholder="Lang" value={track.lang} onChange={(e) => handleBulkSharedAudioChange(idx, "lang", e.target.value)} className="w-16 bg-[#2a2a2a] text-white p-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            <input type="text" placeholder="Audio URL" value={track.url} onChange={(e) => handleBulkSharedAudioChange(idx, "url", e.target.value)} className="flex-[2] bg-[#2a2a2a] text-white p-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            <label className="flex items-center text-xs text-gray-400 gap-1 cursor-pointer">
                              <input type="checkbox" checked={track.default} onChange={(e) => handleBulkSharedAudioChange(idx, "default", e.target.checked)} className="accent-primary" /> Def
                            </label>
                            <button type="button" onClick={() => removeBulkSharedAudio(idx)} className="text-gray-500 hover:text-red-500 p-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setBulkImportOpen(null); setBulkVideoUrls(""); setBulkSharedAudio([]); }}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded font-semibold transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkImport(bulkImportOpen)}
                          disabled={bulkVideoUrls.split("\n").filter(l => l.trim()).length === 0}
                          className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded font-bold transition flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Import {bulkVideoUrls.split("\n").filter(l => l.trim()).length} Episodes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Thumbnail URL</label>
                    <input
                      type="text"
                      name="thumbnailUrl"
                      value={formData.thumbnailUrl}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Banner URL (For Hero)</label>
                    <input
                      type="text"
                      name="bannerUrl"
                      value={formData.bannerUrl}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#2a2a2a] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {loading ? (editingId ? "Saving..." : "Adding...") : (editingId ? "Save Changes" : "Add to Library")}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-6 flex justify-between items-center">
                Manage Content
                <span className="text-sm font-normal text-gray-400">{mediaList.length} Items</span>
              </h2>
              
              {loadingMedia ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : mediaList.length === 0 ? (
                <div className="text-center text-gray-500 py-12">No media found.</div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                  {mediaList.map((item) => (
                    <div key={item._id} className="flex items-center gap-4 bg-[#1e1e1e] p-4 rounded border border-gray-800">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-16 h-10 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{item.title}</h3>
                        <p className="text-xs text-gray-400">{item.type} • {item.genre}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition"
                          title="Edit Media"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                          title="Delete Media"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
