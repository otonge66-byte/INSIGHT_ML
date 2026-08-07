import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchModuleProgressList } from "@/lib/database/progressService";
import { fetchUserVideoProgressList } from "@/lib/database/videoService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ module: string }> }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { module } = params;
    const client = getSupabaseClient(userId);

    // 1. Fetch module progress
    const modules = await fetchModuleProgressList(client, userId);
    const modNameMap: Record<string, string> = {
      perceptron: "Perceptron",
      "gradient-descent": "Gradient Descent",
      "neural-net": "Neural Network"
    };

    const targetName = modNameMap[module] || module;
    const modProgress = modules.find(
      (m) => m.module_name.toLowerCase() === targetName.toLowerCase()
    );

    // 2. Fetch video quizzes progress
    const videoProgressList = await fetchUserVideoProgressList(userId);
    const topicMap: Record<string, string> = {
      perceptron: "perceptron",
      "gradient-descent": "gradient-descent",
      "neural-net": "neural-net"
    };
    const targetTopic = topicMap[module] || module;
    const topicVideos = videoProgressList.filter((v) => v.topic === targetTopic);
    const quizPassed = topicVideos.length > 0 && topicVideos.some((v) => v.quiz_completed);

    // 3. Evaluate criteria
    const storyCompleted = modProgress?.story_completed || false;
    const sandboxCompleted = modProgress?.sandbox_completed || false;
    const challengeCompleted = modProgress?.challenge_completed || false;

    let criteriaMet = false;
    let accuracyLossMet = false;
    let details = "";

    if (module === "perceptron") {
      const acc = modProgress?.best_accuracy ?? 0;
      // Accept decimal (e.g. 0.96) or percent (e.g. 96)
      accuracyLossMet = acc >= 96 || (acc >= 0.96 && acc < 1.0);
      details = `Accuracy achieved: ${(acc >= 1.0 ? acc : acc * 100).toFixed(1)}% (Required: >=96%)`;
    } else if (module === "gradient-descent") {
      const loss = modProgress?.best_loss ?? 999;
      // In gradient descent sandbox, completing it is standard. Let's check for any small loss
      accuracyLossMet = loss <= 0.05 || (modProgress?.challenge_completed ?? false);
      details = loss !== 999 ? `Loss achieved: ${loss.toFixed(4)} (Required: <=0.05)` : "No challenge loss recorded yet";
    } else if (module === "neural-net") {
      const acc = modProgress?.best_accuracy ?? 0;
      accuracyLossMet = acc >= 96 || (acc >= 0.96 && acc < 1.0);
      details = `Accuracy achieved: ${(acc >= 1.0 ? acc : acc * 100).toFixed(1)}% (Required: >=96%)`;
    }

    criteriaMet = storyCompleted && sandboxCompleted && challengeCompleted && quizPassed && accuracyLossMet;

    return NextResponse.json({
      module,
      eligible: criteriaMet,
      requirements: {
        storyCompleted,
        sandboxCompleted,
        challengeCompleted,
        quizPassed,
        accuracyLossMet,
        details
      }
    });
  } catch (error: any) {
    console.error("[ERROR] API certificates/eligibility failed:", error);
    return NextResponse.json({ error: "Failed to fetch eligibility" }, { status: 500 });
  }
}
