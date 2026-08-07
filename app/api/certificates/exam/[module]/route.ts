import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchCertificateExams } from "@/lib/database/certificateService";

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
    const questions = await fetchCertificateExams(userId, module);

    if (questions.length === 0) {
      return NextResponse.json({ error: "No exam questions found for this module" }, { status: 404 });
    }

    // Shuffle and pick 15 questions (or return all if less than 15)
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 15);

    // Shuffle options of each selected question so they are randomized
    const randomizedQuestions = selected.map((q) => ({
      id: q.id,
      question: q.question,
      options: [...q.options].sort(() => Math.random() - 0.5),
      explanation: q.explanation
    }));

    return NextResponse.json(randomizedQuestions);
  } catch (error: any) {
    console.error("[ERROR] API certificates/exam failed:", error);
    return NextResponse.json({ error: "Failed to fetch exam questions" }, { status: 500 });
  }
}
