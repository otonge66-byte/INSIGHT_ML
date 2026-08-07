"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { VideoCard } from "@/components/videos/VideoCard";
import { YouTubeVideoInfo } from "@/lib/videos/youtubeService";
import { fetchUserVideoProgressList } from "@/lib/database/videoService";

// CRT scanline overlay
function ScanlineOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[5]"
      aria-hidden="true"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        animation: "scanScroll 8s linear infinite",
      }}
    />
  );
}

const TOPICS = [
  { id: "perceptron", name: "Perceptron", queryVal: "perceptron" },
  { id: "gradient-descent", name: "Gradient Descent", queryVal: "gradient-descent" },
  { id: "neural-net", name: "Neural Network", queryVal: "neural-net" }
];

export default function VideosPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id;

  const [activeTopic, setActiveTopic] = useState("perceptron");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [videos, setVideos] = useState<YouTubeVideoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");

  // User video completion progress
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());

  // Fetch user progress on mount / auth change
  useEffect(() => {
    async function loadUserProgress() {
      if (isSignedIn && userId) {
        try {
          const list = await fetchUserVideoProgressList(userId);
          const completed = new Set(
            list.filter((item) => item.quiz_completed).map((item) => item.video_id)
          );
          setCompletedVideoIds(completed);
        } catch (e) {
          console.error("[ERROR] Failed to fetch video progress list:", e);
        }
      }
    }
    loadUserProgress();
  }, [isSignedIn, userId]);

  // Fetch videos dynamically when topic, debounced query changes
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos/search?topic=${activeTopic}&query=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) {
        throw new Error("Unable to load video listings");
      }
      const data = await res.json();
      setVideos(data || []);
    } catch (e: any) {
      console.error("[ERROR] failed fetching search videos:", e);
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTopic, debouncedQuery]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handle Search Input submit (or trigger fetch directly)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  // Convert duration ISO code to total seconds for filtering
  const getDurationSeconds = (iso: string): number => {
    try {
      const matches = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!matches) return 600;
      const hours = parseInt(matches[1] || "0", 10);
      const minutes = parseInt(matches[2] || "0", 10);
      const seconds = parseInt(matches[3] || "0", 10);
      return hours * 3600 + minutes * 60 + seconds;
    } catch {
      return 600;
    }
  };

  // Apply filters and sorting client-side
  const filteredVideos = videos
    .filter((vid) => {
      // 1. Difficulty Filter
      if (difficultyFilter !== "all") {
        if (vid.aiMetadata.difficulty.toLowerCase() !== difficultyFilter) {
          return false;
        }
      }
      // 2. Duration Filter
      if (durationFilter !== "all") {
        const secs = getDurationSeconds(vid.duration);
        if (durationFilter === "short" && secs >= 600) return false; // short: < 10 mins
        if (durationFilter === "long" && secs < 600) return false;  // long: >= 10 mins
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "views") {
        return b.views - a.views;
      }
      if (sortBy === "likes") {
        return b.likes - a.likes;
      }
      if (sortBy === "newest") {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      if (sortBy === "shortest") {
        return getDurationSeconds(a.duration) - getDurationSeconds(b.duration);
      }
      if (sortBy === "longest") {
        return getDurationSeconds(b.duration) - getDurationSeconds(a.duration);
      }
      return 0; // relevance (default order from YouTube API)
    });

  return (
    <>
      <ScanlineOverlay />
      <style>{`
        @keyframes scanScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }
        .retro-panel-glow {
          box-shadow: 4px 4px 0px 0px #050d07;
        }
      `}</style>

      <main
        className="relative min-h-screen text-[#e8f0e0] font-vt323 overflow-x-hidden"
        style={{ background: "#070f09" }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
          
          {/* Top Navbar */}
          <nav className="flex items-center justify-between border-4 px-5 py-3" style={{ background: "#0a1a0d", borderColor: "#1e4023", boxShadow: "4px 4px 0px 0px #050d07" }}>
            <div className="flex items-center gap-3">
              <Link href="/" className="font-pixel text-[10px] tracking-widest uppercase hover:text-[#7ecb8a]" style={{ color: "#7ecb8a", textDecoration: "none" }}>
                InsightML
              </Link>
              <span className="font-pixel text-[8px] hidden sm:inline" style={{ color: "#2a5232" }}>
                v1.0.0
              </span>
            </div>
            <HeaderAuthButton />
          </nav>

          {/* Page Title Panel */}
          <div className="bg-[#081209] border-4 border-[#1e4023] p-6 shadow-[6px_6px_0px_#050d07]">
            <h1 className="font-pixel text-xl sm:text-2xl font-bold text-[#7ecb8a] uppercase tracking-wider mb-2">
              📹 Machine Learning Lecture Hall
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#8fc99a] leading-relaxed max-w-3xl">
              Watch selected YouTube videos to master Perceptron, Gradient Descent, and Neural Network basics. Complete the 5-question quiz for each video to earn lesson credits and prepare for final certifications.
            </p>

            {!isSignedIn && isLoaded && (
              <div className="mt-4 bg-[#3a200d] border-2 border-[#dda15e] text-[#f4c284] p-3 text-xs font-sans flex items-center gap-2">
                <span>⚠️</span>
                <span>You are currently in guest mode. Please sign in to track watch progress, attempt video quizzes, and unlock certificates.</span>
              </div>
            )}
          </div>

          {/* Topics & Search Bar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Topic Tabs */}
            <div className="lg:col-span-6 flex gap-2 overflow-x-auto pb-1">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setActiveTopic(topic.queryVal);
                    setSearchQuery("");
                    setDebouncedQuery("");
                  }}
                  className={`font-pixel text-[9px] px-4 py-2.5 border-2 transition-all cursor-pointer rounded-none whitespace-nowrap ${
                    activeTopic === topic.queryVal
                      ? "bg-[#1e4a24] text-[#7ecb8a] border-[#7ecb8a] shadow-[2px_2px_0px_#000000]"
                      : "bg-[#0c1510] text-[#5a9966] border-[#2a5c30] hover:text-[#7ecb8a] hover:border-[#7ecb8a]"
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="lg:col-span-6 flex gap-2">
              <input
                type="text"
                placeholder="Search videos (e.g. StatQuest, Beginner)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c1510] border-2 border-[#2a5c30] px-4 py-2 font-sans text-xs text-[#C9D7CF] focus:outline-none focus:border-[#7ecb8a] rounded-none placeholder:text-[#56a66a]"
              />
              <button
                type="submit"
                className="font-pixel text-[9px] bg-[#1e4a24] text-[#7ecb8a] hover:bg-[#7ecb8a] hover:text-[#182320] border-2 border-[#2a5c30] hover:border-[#7ecb8a] px-5 py-2 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
              >
                SEARCH
              </button>
            </form>
          </div>

          {/* Filtering Sidebar + Video Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Filter controls */}
            <div className="lg:col-span-3 bg-[#081209] border-4 border-[#1e4023] p-5 shadow-[4px_4px_0px_#000000] space-y-5">
              <h2 className="font-pixel text-[10px] text-[#dda15e] border-b border-[#2a5c30] pb-2 uppercase tracking-wider">
                ⚙️ Filter Options
              </h2>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="font-pixel text-[8px] text-[#56a66a] uppercase block">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full bg-[#0c1510] border border-[#2a5c30] px-2 py-1.5 font-sans text-xs text-[#8fc99a] focus:outline-none focus:border-[#7ecb8a] rounded-none cursor-pointer"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="font-pixel text-[8px] text-[#56a66a] uppercase block">Duration</label>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className="w-full bg-[#0c1510] border border-[#2a5c30] px-2 py-1.5 font-sans text-xs text-[#8fc99a] focus:outline-none focus:border-[#7ecb8a] rounded-none cursor-pointer"
                >
                  <option value="all">Any Length</option>
                  <option value="short">Short (&lt; 10 min)</option>
                  <option value="long">Long (&ge; 10 min)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="font-pixel text-[8px] text-[#56a66a] uppercase block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#0c1510] border border-[#2a5c30] px-2 py-1.5 font-sans text-xs text-[#8fc99a] focus:outline-none focus:border-[#7ecb8a] rounded-none cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                  <option value="newest">Newest</option>
                  <option value="shortest">Shortest</option>
                  <option value="longest">Longest</option>
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setDifficultyFilter("all");
                  setDurationFilter("all");
                  setSortBy("relevance");
                  setSearchQuery("");
                  setDebouncedQuery("");
                }}
                className="w-full font-pixel text-[8px] bg-[#2a0d0d] text-[#bc4749] hover:bg-[#bc4749] hover:text-[#182320] border border-[#bc4749] py-2 transition-all cursor-pointer rounded-none shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
              >
                RESET FILTERS
              </button>
            </div>

            {/* Video List Grid */}
            <div className="lg:col-span-9">
              {loading ? (
                <div className="text-center py-16 bg-[#081209] border-4 border-[#1e4023] shadow-[4px_4px_0px_#000000]">
                  <p className="font-pixel text-[12px] text-[#dda15e] animate-pulse">📡 SCANNING FREQUENCIES...</p>
                  <p className="font-sans text-xs text-[#56a66a] mt-2">Connecting to YouTube Data API</p>
                </div>
              ) : error ? (
                <div className="bg-[#2a0d0d]/40 border-4 border-[#bc4749] p-8 shadow-[4px_4px_0px_#000000] text-center">
                  <p className="font-pixel text-[12px] text-[#e57373] mb-3">📡 FREQUENCY CONNECTION ERROR</p>
                  <p className="font-sans text-xs text-[#bc4749] mb-6">{error}</p>
                  <button
                    onClick={fetchVideos}
                    className="font-pixel text-[8px] bg-[#bc4749] text-[#182320] px-6 py-2.5 transition-all cursor-pointer font-bold border border-[#bc4749] hover:bg-transparent hover:text-[#bc4749]"
                  >
                    RETRY SCAN
                  </button>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-16 bg-[#081209] border-4 border-[#1e4023] shadow-[4px_4px_0px_#000000]">
                  <p className="font-pixel text-[11px] text-[#dda15e] mb-1">🔍 NO VIDEOS MATCH SEARCH CRITERIA</p>
                  <p className="font-sans text-xs text-[#56a66a]">Try adjusting your filters or query string.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredVideos.map((video) => (
                    <VideoCard 
                      key={video.videoId} 
                      video={video} 
                      isCompleted={completedVideoIds.has(video.videoId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base" style={{ borderColor: "#1a3a1e", color: "#2a5232" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — LECTURE PREPARATION ENGINE</span>
            <div className="flex gap-4">
              <Link href="/" className="font-pixel text-[8px] text-[#2a5232] hover:text-[#7ecb8a]" style={{ textDecoration: "none" }}>
                Dashboard
              </Link>
              <Link href="/certificates" className="font-pixel text-[8px] text-[#2a5232] hover:text-[#7ecb8a]" style={{ textDecoration: "none" }}>
                Certificates
              </Link>
            </div>
          </footer>

        </div>
      </main>
    </>
  );
}
