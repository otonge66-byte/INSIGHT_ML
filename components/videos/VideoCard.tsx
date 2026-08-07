import React from "react";
import Link from "next/link";
import { YouTubeVideoInfo, formatISODuration } from "@/lib/videos/youtubeService";

interface VideoCardProps {
  video: YouTubeVideoInfo;
  isCompleted?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, isCompleted = false }) => {
  const formattedDuration = formatISODuration(video.duration);
  const formattedViews = video.views >= 1000000 
    ? `${(video.views / 1000000).toFixed(1)}M` 
    : video.views >= 1000 
    ? `${(video.views / 1000).toFixed(0)}K` 
    : video.views;

  const difficultyColors = {
    Beginner: "border-[#7ecb8a] text-[#7ecb8a] bg-[#1e4a24]",
    Intermediate: "border-[#dda15e] text-[#dda15e] bg-[#2e1d0c]",
    Advanced: "border-[#bc4749] text-[#bc4749] bg-[#2a0d0d]"
  };

  const diffColor = difficultyColors[video.aiMetadata.difficulty] || difficultyColors.Beginner;

  return (
    <div className="bg-[#0c1510] border-2 border-[#2a5c30] p-4 flex flex-col justify-between shadow-[4px_4px_0px_#000000] relative group hover:border-[#7ecb8a] transition-all">
      {/* Complete Badge */}
      {isCompleted && (
        <span className="absolute top-2.5 right-2.5 z-10 font-pixel text-[8px] bg-[#1e4a24] text-[#7ecb8a] border border-[#7ecb8a] px-1.5 py-0.5 animate-pulse">
          ✓ COMPLETED
        </span>
      )}

      <div>
        {/* Thumbnail Layer */}
        <div className="relative aspect-video mb-3 overflow-hidden border border-[#2a5c30]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[10px] px-1 py-0.5 border border-[#2a5c30]">
            {formattedDuration}
          </span>
        </div>

        {/* Info Area */}
        <div className="flex gap-2 items-center mb-1.5">
          <span className={`font-pixel text-[7px] border px-1 py-0.5 tracking-widest uppercase ${diffColor}`}>
            {video.aiMetadata.difficulty}
          </span>
          <span className="font-pixel text-[7px] text-[#dda15e] bg-[#2e1d0c] border border-[#dda15e] px-1 py-0.5">
            ⌛ {video.aiMetadata.estimatedWatchTime}
          </span>
        </div>

        <h3 className="font-pixel text-[11px] leading-relaxed text-[#7ecb8a] mb-2 group-hover:text-[#a1e2ac] transition-colors line-clamp-2">
          {video.title}
        </h3>

        <p className="font-sans text-[11px] text-[#56a66a] mb-1">
          📺 {video.channelName}
        </p>

        <p className="font-sans text-[10px] text-[#8fc99a] line-clamp-3 leading-normal mb-3">
          {video.description}
        </p>
      </div>

      <div className="border-t border-[#2a5c30] pt-2.5 mt-auto flex items-center justify-between">
        <div className="font-mono text-[9px] text-[#56a66a] flex flex-col">
          <span>👀 {formattedViews} Views</span>
          <span>📅 {new Date(video.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
        </div>

        <Link
          href={`/videos/${video.videoId}`}
          className="font-pixel text-[8px] bg-[#1e4a24] text-[#7ecb8a] hover:bg-[#7ecb8a] hover:text-[#182320] border border-[#2a5c30] hover:border-[#7ecb8a] px-3.5 py-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
        >
          START LESSON
        </Link>
      </div>
    </div>
  );
};
