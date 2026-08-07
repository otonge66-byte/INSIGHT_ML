import { NextRequest, NextResponse } from "next/server";
import { searchEducationalVideos } from "@/lib/videos/youtubeService";

// Simplistic caching in memory for YouTube API calls (TTL: 1 hour)
interface CacheEntry {
  timestamp: number;
  data: any;
}
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || "perceptron";
    const query = searchParams.get("query") || "";

    const cacheKey = `${topic}_${query}`;
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const videos = await searchEducationalVideos(topic, query);

    // Cache the result
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: videos
    };

    return NextResponse.json(videos);
  } catch (error: any) {
    console.error("[ERROR] API videos/search failed:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
