import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { issueCertificate, saveCertificateResult, fetchCertificateExams } from "@/lib/database/certificateService";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchModuleProgressList } from "@/lib/database/progressService";
import { fetchUserVideoProgressList } from "@/lib/database/videoService";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    if (!userId || !clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { module, answers, totalQuestions } = body;

    if (!module || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch exam questions from DB and grade secure server-side
    const questions = await fetchCertificateExams(userId, module);
    let correctCount = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 80;

    // 2. Save detailed exam attempt
    await saveCertificateResult(userId, {
      module,
      score,
      total_questions: questions.length,
      passed
    });

    if (!passed) {
      return NextResponse.json({ 
        passed: false, 
        message: "You did not achieve the required passing score of 80%." 
      });
    }

    // 2. Perform Eligibility Verification on server to prevent fake issues
    const client = getSupabaseClient(userId);
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

    // Video check
    const videoProgressList = await fetchUserVideoProgressList(userId);
    const topicMap: Record<string, string> = {
      perceptron: "perceptron",
      "gradient-descent": "gradient-descent",
      "neural-net": "neural-net"
    };
    const targetTopic = topicMap[module] || module;
    const topicVideos = videoProgressList.filter((v) => v.topic === targetTopic);
    const quizPassed = topicVideos.length > 0 && topicVideos.some((v) => v.quiz_completed);

    const storyCompleted = modProgress?.story_completed || false;
    const sandboxCompleted = modProgress?.sandbox_completed || false;
    const challengeCompleted = modProgress?.challenge_completed || false;

    let accuracyLossMet = false;
    if (module === "perceptron") {
      const acc = modProgress?.best_accuracy ?? 0;
      accuracyLossMet = acc >= 96 || (acc >= 0.96 && acc < 1.0);
    } else if (module === "gradient-descent") {
      const loss = modProgress?.best_loss ?? 999;
      accuracyLossMet = loss <= 0.05 || (modProgress?.challenge_completed ?? false);
    } else if (module === "neural-net") {
      const acc = modProgress?.best_accuracy ?? 0;
      accuracyLossMet = acc >= 96 || (acc >= 0.96 && acc < 1.0);
    }

    const eligible = storyCompleted && sandboxCompleted && challengeCompleted && quizPassed && accuracyLossMet;

    if (!eligible) {
      return NextResponse.json({ 
        passed: true,
        eligible: false,
        message: "You passed the exam, but have not met all 5 module requirements to unlock this certificate." 
      });
    }

    // 3. Issue certificate with unique ID
    const studentName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "InsightML Graduate";
    const certId = `IML-${module.toUpperCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const certRecord = await issueCertificate(userId, {
      module,
      student_name: studentName,
      cert_id: certId
    });

    return NextResponse.json({
      passed: true,
      eligible: true,
      certificate: certRecord
    });
  } catch (error: any) {
    console.error("[ERROR] API certificates/generate failed:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
