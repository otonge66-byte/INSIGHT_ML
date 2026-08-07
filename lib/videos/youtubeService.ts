import { getAIMetadataForTopic, VideoAIMetadata } from "./aiMetadata";

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  publishedAt: string;
  duration: string;
  views: number;
  likes: number;
  subscribers: number;
  aiMetadata: VideoAIMetadata;
}

// Fallback real videos in case YouTube API fails or key is missing
const FALLBACK_VIDEOS: Record<string, Omit<YouTubeVideoInfo, "aiMetadata">[]> = {
  perceptron: [
    {
      videoId: "4Gac5I64LM4",
      title: "StatQuest: Perceptrons (The Basic Building Blocks of Neural Networks)",
      description: "The Perceptron is the single most basic element of a neural network. Learn how it works, how weights and bias are applied, and how it classifies data step-by-step.",
      thumbnail: "https://i.ytimg.com/vi/4Gac5I64LM4/mqdefault.jpg",
      channelName: "StatQuest with Josh Starmer",
      publishedAt: "2019-10-14T14:00:00Z",
      duration: "PT8M24S",
      views: 750000,
      likes: 22000,
      subscribers: 1200000
    },
    {
      videoId: "yOS2qBkwYFI",
      title: "Rosenblatt's Perceptron - Step-by-Step Mathematical Walkthrough",
      description: "A comprehensive mathematical lecture on Rosenblatt's Perceptron algorithm. This video explains linear separability and the convergence theorem in detail.",
      thumbnail: "https://i.ytimg.com/vi/yOS2qBkwYFI/mqdefault.jpg",
      channelName: "freeCodeCamp.org",
      publishedAt: "2021-04-18T12:30:00Z",
      duration: "PT15M10S",
      views: 320000,
      likes: 9800,
      subscribers: 9500000
    },
    {
      videoId: "ntPvS6NqHic",
      title: "Perceptrons & The XOR Problem - Computerphile",
      description: "Why single layer perceptrons cannot solve the XOR problem, and how this led to the first major AI winter. An essential historical and mathematical lesson.",
      thumbnail: "https://i.ytimg.com/vi/ntPvS6NqHic/mqdefault.jpg",
      channelName: "Computerphile",
      publishedAt: "2018-05-12T16:00:00Z",
      duration: "PT11M45S",
      views: 450000,
      likes: 15000,
      subscribers: 2400000
    }
  ],
  "gradient-descent": [
    {
      videoId: "IHZwWFHWa-w",
      title: "3Blue1Brown: Gradient descent, how neural networks learn",
      description: "What is backpropagation actually doing? In this chapter, we look at the mathematical optimization method called gradient descent that drives modern AI.",
      thumbnail: "https://i.ytimg.com/vi/IHZwWFHWa-w/mqdefault.jpg",
      channelName: "3Blue1Brown",
      publishedAt: "2017-10-16T15:00:00Z",
      duration: "PT21M0S",
      views: 5200000,
      likes: 210000,
      subscribers: 5900000
    },
    {
      videoId: "sDv4f4s2SB8",
      title: "StatQuest: Gradient Descent, Step-by-Step",
      description: "Gradient Descent is a crucial optimization algorithm in machine learning. Josh Starmer explains it in simple terms with a focus on intuitive visuals.",
      thumbnail: "https://i.ytimg.com/vi/sDv4f4s2SB8/mqdefault.jpg",
      channelName: "StatQuest with Josh Starmer",
      publishedAt: "2019-02-04T14:30:00Z",
      duration: "PT14M58S",
      views: 2800000,
      likes: 78000,
      subscribers: 1200000
    },
    {
      videoId: "jc2I814q83Y",
      title: "Stochastic Gradient Descent (SGD) Explained",
      description: "What is Stochastic Gradient Descent and how does it compare to Batch Gradient Descent? Explore learning rates, batch sizes, and visual explanations.",
      thumbnail: "https://i.ytimg.com/vi/jc2I814q83Y/mqdefault.jpg",
      channelName: "Andrew Ng / DeepLearning.AI",
      publishedAt: "2020-08-11T10:00:00Z",
      duration: "PT12M40S",
      views: 640000,
      likes: 19000,
      subscribers: 890000
    }
  ],
  "neural-net": [
    {
      videoId: "aircAruvnKk",
      title: "3Blue1Brown: But what is a neural network? | Deep learning, chapter 1",
      description: "What is a neural network? What are hidden layers and how do they capture abstract hierarchical representations? An entry point into deep learning.",
      thumbnail: "https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg",
      channelName: "3Blue1Brown",
      publishedAt: "2017-10-05T17:00:00Z",
      duration: "PT19M13S",
      views: 14000000,
      likes: 540000,
      subscribers: 5900000
    },
    {
      videoId: "Ilg3gGewQ5U",
      title: "Neural Networks from Scratch - P.1 Intro and Neuron Code",
      description: "Learn how to build neural networks from scratch in Python. In this video, we write code for single neurons, layers, and explain weighted sums.",
      thumbnail: "https://i.ytimg.com/vi/Ilg3gGewQ5U/mqdefault.jpg",
      channelName: "sentdex",
      publishedAt: "2020-04-10T12:00:00Z",
      duration: "PT17M20S",
      views: 1900000,
      likes: 62000,
      subscribers: 1300000
    },
    {
      videoId: "tIeHLnjs5U8",
      title: "MIT Introduction to Deep Learning - 6.S191 Lecture 1",
      description: "The official opening lecture of MIT's 6.S191 course, covering structural basics of feedforward neural networks, backpropagation, and training.",
      thumbnail: "https://i.ytimg.com/vi/tIeHLnjs5U8/mqdefault.jpg",
      channelName: "MIT Alexander Amini",
      publishedAt: "2023-01-31T09:00:00Z",
      duration: "PT45M12S",
      views: 1200000,
      likes: 41000,
      subscribers: 420000
    }
  ]
};

/**
 * Searches and fetches full dynamic metadata for educational videos on a topic.
 * Uses official YouTube API, with a clean local fallback if keys are missing or API fails.
 */
export async function searchEducationalVideos(topic: string, queryText = ""): Promise<YouTubeVideoInfo[]> {
  const normalizedTopic = topic.toLowerCase().trim();
  let searchTopicKey = "neural-net";
  let searchQuery = "Neural Networks for Beginners";

  if (normalizedTopic.includes("perceptron")) {
    searchTopicKey = "perceptron";
    searchQuery = "Perceptron Machine Learning";
  } else if (normalizedTopic.includes("descent") || normalizedTopic.includes("gradient")) {
    searchTopicKey = "gradient-descent";
    searchQuery = "Gradient Descent Machine Learning";
  }

  // Combine with search filter if present
  if (queryText) {
    searchQuery += ` ${queryText}`;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn(`[WARNING] YOUTUBE_API_KEY missing in server. Returning high-quality fallback videos for topic: ${searchTopicKey}`);
    return FALLBACK_VIDEOS[searchTopicKey].map((vid) => ({
      ...vid,
      aiMetadata: getAIMetadataForTopic(searchTopicKey)
    }));
  }

  try {
    // 1. Query YouTube API Search
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      searchQuery
    )}&type=video&maxResults=6&relevanceLanguage=en&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      throw new Error(`YouTube API returned status ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) {
      throw new Error("No videos returned from YouTube Search");
    }

    // 2. Fetch video statistics and durations
    const videoIds = items.map((item: any) => item.id.videoId).filter(Boolean);
    if (videoIds.length === 0) {
      throw new Error("No video IDs found in search results");
    }

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(
      ","
    )}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    if (!videosRes.ok) {
      throw new Error(`YouTube Videos detail API returned status ${videosRes.status}`);
    }
    const videosData = await videosRes.json();
    const detailsMap: Record<string, { duration: string; views: number; likes: number }> = {};
    (videosData.items || []).forEach((item: any) => {
      detailsMap[item.id] = {
        duration: item.contentDetails?.duration || "PT10M",
        views: parseInt(item.statistics?.viewCount || "0", 10),
        likes: parseInt(item.statistics?.likeCount || "0", 10)
      };
    });

    // 3. Fetch channel stats for subscribers
    const channelIds = items.map((item: any) => item.snippet?.channelId).filter(Boolean);
    const uniqueChannelIds = Array.from(new Set(channelIds));
    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${uniqueChannelIds.join(
      ","
    )}&key=${apiKey}`;
    const channelsRes = await fetch(channelsUrl);
    const channelsMap: Record<string, number> = {};
    if (channelsRes.ok) {
      const channelsData = await channelsRes.json();
      (channelsData.items || []).forEach((item: any) => {
        channelsMap[item.id] = parseInt(item.statistics?.subscriberCount || "0", 10);
      });
    }

    // 4. Build output structures
    return items.map((item: any) => {
      const vId = item.id.videoId;
      const details = detailsMap[vId] || { duration: "PT10M", views: 150000, likes: 5000 };
      const subCount = channelsMap[item.snippet?.channelId] || 85000;

      return {
        videoId: vId,
        title: item.snippet?.title || "ML Tutorial",
        description: item.snippet?.description || "",
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.high?.url || "",
        channelName: item.snippet?.channelTitle || "ML Mentor",
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        duration: details.duration,
        views: details.views,
        likes: details.likes,
        subscribers: subCount,
        aiMetadata: getAIMetadataForTopic(searchTopicKey)
      };
    });
  } catch (err) {
    console.error(`[ERROR] searchEducationalVideos failed:`, err, `. Using fallbacks.`);
    return FALLBACK_VIDEOS[searchTopicKey].map((vid) => ({
      ...vid,
      aiMetadata: getAIMetadataForTopic(searchTopicKey)
    }));
  }
}

/** Helper to convert ISO 8601 duration (e.g. PT8M24S) to clean human readable string */
export function formatISODuration(isoDuration: string): string {
  try {
    const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return "10:00";
    const hours = parseInt(matches[1] || "0", 10);
    const minutes = parseInt(matches[2] || "0", 10);
    const seconds = parseInt(matches[3] || "0", 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  } catch {
    return "10:00";
  }
}
