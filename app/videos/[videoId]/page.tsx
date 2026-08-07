"use client";

import React, { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { HeaderAuthButton } from "@/components/ui/HeaderAuthButton";
import { AISummaryPanel } from "@/components/videos/AISummaryPanel";
import { MiniQuiz } from "@/components/videos/MiniQuiz";
import { searchEducationalVideos, YouTubeVideoInfo } from "@/lib/videos/youtubeService";
import { upsertVideoProgress, fetchUserVideoProgressList } from "@/lib/database/videoService";

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

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default function VideoDetailPage({ params }: PageProps) {
  const { videoId } = use(params);
  const { user, isLoaded, isSignedIn } = useUser();
  const userId = user?.id || "guest_user";

  const [video, setVideo] = useState<YouTubeVideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Watch states
  const [isWatched, setIsWatched] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [updatingWatch, setUpdatingWatch] = useState(false);

  // Load video details and progress
  useEffect(() => {
    async function loadVideoData() {
      setLoading(true);
      setError(null);
      try {
        // Search across all topics to find this specific videoId
        const topics = ["perceptron", "gradient-descent", "neural-net"];
        let foundVideo: YouTubeVideoInfo | null = null;

        for (const t of topics) {
          const list = await searchEducationalVideos(t);
          const match = list.find((v) => v.videoId === videoId);
          if (match) {
            foundVideo = match;
            break;
          }
        }

        if (!foundVideo) {
          // Attempt generic fetch or fallback if none found
          const fallbackList = await searchEducationalVideos("perceptron");
          foundVideo = fallbackList[0];
        }

        setVideo(foundVideo);

        // Fetch watch status if signed in
        if (isSignedIn && user?.id) {
          const progressList = await fetchUserVideoProgressList(user.id);
          const matchProgress = progressList.find((p) => p.video_id === videoId);
          if (matchProgress) {
            setIsWatched(matchProgress.watched);
            setIsQuizCompleted(matchProgress.quiz_completed);
            setQuizScore(matchProgress.quiz_score || null);
          }
        }
      } catch (e: any) {
        console.error("[ERROR] Failed loading video details:", e);
        setError("Unable to retrieve video information. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadVideoData();
  }, [videoId, isSignedIn, user]);

  const handleMarkWatched = async () => {
    if (!isSignedIn) {
      alert("Please sign in to save your learning progress!");
      return;
    }
    if (!video || updatingWatch) return;

    setUpdatingWatch(true);
    try {
      await upsertVideoProgress(userId, {
        video_id: videoId,
        topic: video.aiMetadata.concepts[0]?.toLowerCase() || "perceptron",
        watched: true,
        watch_percentage: 100,
        quiz_completed: isQuizCompleted,
        quiz_score: quizScore,
        completed_at: isQuizCompleted ? new Date().toISOString() : null
      });
      setIsWatched(true);
    } catch (e) {
      console.error("[ERROR] Failed to save watch progress:", e);
      alert("Failed to mark video as watched. Check connection.");
    } finally {
      setUpdatingWatch(false);
    }
  };

  const handleQuizCompleted = (score: number, passed: boolean) => {
    if (passed) {
      setIsQuizCompleted(true);
      setQuizScore(score);
      setIsWatched(true); // Passing quiz automatically marks the video watched
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-[#e8f0e0] font-vt323 flex items-center justify-center bg-[#070f09]">
        <ScanlineOverlay />
        <div className="text-center">
          <p className="font-pixel text-[12px] text-[#dda15e] animate-pulse">📡 BUFFERING TRANSMISSION...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen text-[#e8f0e0] font-vt323 flex items-center justify-center bg-[#070f09] p-4">
        <ScanlineOverlay />
        <div className="bg-[#2a0d0d] border-4 border-[#bc4749] p-8 max-w-md w-full shadow-[6px_6px_0px_#000000] text-center">
          <p className="font-pixel text-[12px] text-[#e57373] mb-4">✕ LESSON STREAM OFFLINE</p>
          <p className="font-sans text-xs text-[#bc4749] mb-6">{error || "Video not found."}</p>
          <Link href="/videos" className="font-pixel text-[8px] bg-[#bc4749] text-[#182320] border border-[#bc4749] px-6 py-2 transition-all hover:bg-transparent hover:text-[#bc4749]">
            RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScanlineOverlay />
      <style>{`
        @keyframes scanScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }
      `}</style>

      <main
        className="relative min-h-screen text-[#e8f0e0] font-vt323 overflow-x-hidden"
        style={{ background: "#070f09" }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">

          {/* Nav */}
          <nav className="flex items-center justify-between border-4 px-5 py-3" style={{ background: "#0a1a0d", borderColor: "#1e4023", boxShadow: "4px 4px 0px 0px #050d07" }}>
            <div className="flex items-center gap-3">
              <Link href="/videos" className="font-pixel text-[9px] text-[#7ecb8a] hover:text-[#dda15e] uppercase tracking-wider">
                ◀ back to videos
              </Link>
            </div>
            <HeaderAuthButton />
          </nav>

          {/* Split Video Iframe + Sidebar Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Iframe + Title + Description + Quiz */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* YouTube Iframe Screen */}
              <div className="bg-[#081209] border-4 border-[#1e4023] p-1.5 shadow-[6px_6px_0px_#050d07]">
                <div className="relative aspect-video w-full bg-black border border-[#2a5c30]">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=0&rel=0`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>

              {/* Video Title and Stats Row */}
              <div className="bg-[#081209] border-4 border-[#1e4023] p-5 shadow-[4px_4px_0px_#000000]">
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <span className="font-pixel text-[8px] bg-[#1e4a24] text-[#7ecb8a] border border-[#2a6832] px-2 py-0.5">
                    {video.aiMetadata.difficulty}
                  </span>
                  <span className="font-pixel text-[8px] bg-[#2e1d0c] text-[#dda15e] border border-[#dda15e] px-2 py-0.5">
                    ⌛ WATCH: {video.aiMetadata.estimatedWatchTime}
                  </span>
                  {isWatched && (
                    <span className="font-pixel text-[8px] bg-[#1e4a24] text-[#7ecb8a] border border-[#7ecb8a] px-2 py-0.5 ml-auto">
                      ✓ WATCHED
                    </span>
                  )}
                </div>

                <h1 className="font-pixel text-[13px] sm:text-[15px] leading-relaxed text-[#7ecb8a] mb-3">
                  {video.title}
                </h1>

                <div className="border-t border-b border-[#2a5c30]/50 py-3 mb-4 flex flex-wrap justify-between items-center gap-4 text-xs font-sans text-[#8fc99a]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none bg-[#121e17] border border-[#2a5c30] text-[#7ecb8a] flex items-center justify-center font-bold">
                      {video.channelName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-pixel text-[9px] text-[#7ecb8a]">{video.channelName}</p>
                      <p className="text-[10px] text-[#56a66a]">{video.subscribers.toLocaleString()} subscribers</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span>👍 {video.likes.toLocaleString()} Likes</span>
                    <span>👀 {video.views.toLocaleString()} Views</span>
                  </div>
                </div>

                <p className="font-sans text-xs text-[#C9D7CF] leading-relaxed whitespace-pre-line bg-[#0c1510] p-3 border border-[#1e4023]">
                  {video.description || "No description provided."}
                </p>

                {/* Mark Watched button */}
                <div className="mt-4 flex justify-end">
                  {!isWatched ? (
                    <button
                      onClick={handleMarkWatched}
                      disabled={updatingWatch}
                      className="font-pixel text-[8px] bg-[#1e4a24] text-[#7ecb8a] hover:bg-[#7ecb8a] hover:text-[#182320] border-2 border-[#2a5c30] hover:border-[#7ecb8a] px-5 py-2.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
                    >
                      {updatingWatch ? "MARKING..." : "MARK AS WATCHED"}
                    </button>
                  ) : (
                    <span className="font-pixel text-[8px] text-[#56a66a] border border-[#2a5c30] px-4 py-2.5 bg-[#0c1510]">
                      ● THIS LECTURE HAS BEEN WATCHED
                    </span>
                  )}
                </div>
              </div>

              {/* Mini Quiz Segment */}
              {isSignedIn ? (
                <MiniQuiz 
                  videoId={videoId}
                  topic={video.aiMetadata.concepts[0]?.toLowerCase() || "perceptron"}
                  userId={userId}
                  questions={video.aiMetadata.quiz}
                  onQuizCompleted={handleQuizCompleted}
                />
              ) : (
                <div className="bg-[#081209] border-4 border-[#1e4023] p-6 shadow-[6px_6px_0px_#050d07] text-center">
                  <p className="font-pixel text-[11px] text-[#dda15e] mb-2">🔒 QUIZ IS LOCKED</p>
                  <p className="font-sans text-xs text-[#56a66a] mb-4">Please sign in to take the quiz and earn lesson credits.</p>
                </div>
              )}

            </div>

            {/* Right Column: AI summary details */}
            <div className="lg:col-span-4">
              <AISummaryPanel metadata={video.aiMetadata} />
            </div>

          </div>

          {/* Footer */}
          <footer className="border-t-2 pt-4 flex items-center justify-between text-base" style={{ borderColor: "#1a3a1e", color: "#2a5232" }}>
            <span className="font-pixel text-[8px]">InsightML © 2026 — LECTURE SCREEN</span>
            <div className="flex gap-4">
              <Link href="/videos" className="font-pixel text-[8px] text-[#2a5232] hover:text-[#7ecb8a]">
                Videos Index
              </Link>
            </div>
          </footer>

        </div>
      </main>
    </>
  );
}
