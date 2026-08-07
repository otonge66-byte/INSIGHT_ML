import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface ExamInterfaceProps {
  moduleKey: string;
  moduleName: string;
  questions: Question[];
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  moduleKey,
  moduleName,
  questions
}) => {
  const router = useRouter();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins in seconds
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [examPassed, setExamPassed] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer interval
  useEffect(() => {
    if (finished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, finished]);

  // Auto-submit if time runs out
  useEffect(() => {
    if (timeLeft === 0 && !finished) {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleSelectOption = (opt: string) => {
    const activeQuestion = questions[currentIdx];
    setSelectedAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: opt
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting || finished) return;

    // Check if all questions are answered
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length && timeLeft > 0) {
      const confirmSubmit = window.confirm(
        `You have only answered ${answeredCount}/${questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    // Calculate score. Since we submit to backend, let's grade it securely on the server!
    // Wait, the backend endpoint /api/certificates/generate handles grading, but we need to supply the answers.
    // Let's first grade locally to display immediately, and send options.
    // Wait! Let's retrieve correct answers from server, or let the server grade.
    // Let's look at the generation route: it takes `score` directly from the client request body to save.
    // That means we need to evaluate the correct score on the client or let the route do it!
    // Since the client got the questions and answers from `/api/certificates/exam/[module]`, wait, does `/api/certificates/exam/[module]` return the correct answers?
    // Let's check: in `app/api/certificates/exam/[module]/route.ts`:
    // It returns: `{ id, question, options, explanation }` — it does NOT return `correct_answer` to prevent cheating!
    // This is a secure production design!
    // That means we must POST the selected answers to a grading endpoint, or evaluate them server-side.
    // Let's design the `/api/certificates/generate` to accept `answers` (Record<questionId, selectedOption>) instead of client-calculated `score`, or add a secure grading step!
    // Wait, let's look at `app/api/certificates/generate/route.ts` we created earlier.
    // It takes `score` from `body`. Since we want security, let's modify `/api/certificates/generate/route.ts` to grade it server-side using the DB records, so students cannot spoof their exam scores in POST requests!
    // This is a critical security fix. Let's make sure the client POSTs `answers` and the server fetches correct answers, grades them, saves result, and issues certificate!
    // Let's check how we can adapt this.
    // Yes! Let's modify the client to POST the `answers: Record<string, string>` map, and we will update `app/api/certificates/generate/route.ts` to grade it on the server!
    // Let's first write this component, then update the API route.
    
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: moduleKey,
          answers: selectedAnswers,
          totalQuestions: questions.length
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit exam");
      }

      setExamScore(data.score);
      setExamPassed(data.passed);
      setFinished(true);
    } catch (e: any) {
      console.error("[ERROR] Failed submitting exam:", e);
      setErrorMessage(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeQuestion = questions[currentIdx];
  const isAnswered = activeQuestion ? !!selectedAnswers[activeQuestion.id] : false;

  if (questions.length === 0) return null;

  if (finished) {
    return (
      <div className="bg-[#081209] border-4 border-[#1e4023] p-8 shadow-[6px_6px_0px_#050d07] text-center max-w-2xl mx-auto">
        <h3 className="font-pixel text-[14px] text-[#dda15e] uppercase tracking-wider mb-4">
          🏁 Exam Results Submitted
        </h3>

        <div className="bg-[#121e17] border-2 border-[#2a5c30] p-6 mb-6 inline-block">
          <p className="font-pixel text-[8px] text-[#8fc99a] uppercase mb-1">YOUR EXAM SCORE</p>
          <p className={`font-vt323 text-5xl font-bold ${examPassed ? "text-[#7ecb8a]" : "text-[#bc4749]"}`}>
            {examScore}%
          </p>
          <span className={`font-pixel text-[9px] border px-2 py-0.5 mt-2 inline-block ${
            examPassed ? "bg-[#1e4a24] text-[#7ecb8a] border-[#7ecb8a]" : "bg-[#2a0d0d] text-[#bc4749] border-[#bc4749]"
          }`}>
            {examPassed ? "PASSED" : "FAILED"}
          </span>
        </div>

        <div className="font-sans text-xs text-[#8fc99a] leading-relaxed mb-8 max-w-md mx-auto space-y-3">
          {examPassed ? (
            <p>
              Excellent work! You passed the final certification exam (required: &ge;80%). Your unique digital certificate has been issued and stored in our verification database.
            </p>
          ) : (
            <p>
              Unfortunately, you did not meet the passing score of 80% (12/15 correct answers). Do not worry! Review the materials, run the simulations, and click below to try again when you are ready.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {examPassed ? (
            <button
              onClick={() => router.push(`/certificates/${moduleKey}`)}
              className="font-pixel text-[9px] bg-[#1e4a24] text-[#7ecb8a] hover:bg-[#7ecb8a] hover:text-[#182320] border-2 border-[#2a5c30] px-6 py-2.5 transition-all cursor-pointer shadow-[3px_3px_0px_#000000] active:translate-y-0.5 font-bold"
            >
              GO TO PORTAL
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="font-pixel text-[9px] bg-[#2a0d0d] text-[#bc4749] hover:bg-[#bc4749] hover:text-[#182320] border-2 border-[#bc4749] px-6 py-2.5 transition-all cursor-pointer shadow-[3px_3px_0px_#000000] active:translate-y-0.5 font-bold"
            >
              RETRY EXAM
            </button>
          )}
          <Link
            href="/certificates"
            className="font-pixel text-[9px] bg-[#0c1510] text-[#dda15e] border-2 border-[#dda15e] hover:bg-[#dda15e] hover:text-[#182320] px-6 py-2.5 text-center transition-all shadow-[3px_3px_0px_#000000] active:translate-y-0.5"
          >
            ALL CERTIFICATES
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="bg-[#081209] border-4 border-[#1e4023] p-5 sm:p-6 shadow-[6px_6px_0px_#050d07] max-w-3xl mx-auto">
      {/* Header Stat Board */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#1e4023] pb-4 mb-6 gap-3">
        <div>
          <span className="font-pixel text-[8px] bg-[#2e1d0c] text-[#dda15e] border border-[#dda15e] px-2 py-0.5 uppercase">
            {moduleName} Specialist
          </span>
          <h2 className="font-pixel text-sm text-[#7ecb8a] uppercase mt-1">Certification Exam</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#0c1510] border border-[#2a5c30] px-3 py-1.5 text-center">
            <span className="font-pixel text-[7px] text-[#56a66a] block">QUESTIONS</span>
            <span className="font-mono text-sm text-[#7ecb8a] font-bold">{answeredCount}/{questions.length}</span>
          </div>

          <div className="bg-[#0c1510] border border-[#2a5c30] px-3 py-1.5 text-center">
            <span className="font-pixel text-[7px] text-[#56a66a] block">TIME REMAINING</span>
            <span className="font-mono text-sm text-[#dda15e] font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#0c1510] border border-[#2a5c30] mb-6 overflow-hidden">
        <div 
          className="h-full bg-[#dda15e] transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Active Question Display */}
      <div className="min-h-[220px] mb-6">
        <div className="flex justify-between text-[8px] font-pixel text-[#56a66a] mb-2.5">
          <span>QUESTION {currentIdx + 1} OF {questions.length}</span>
          <span>DIFFICULTY: SECURE_RANDOM</span>
        </div>

        <h3 className="font-pixel text-[11px] leading-relaxed text-[#7ecb8a] mb-5">
          {activeQuestion.question}
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          {activeQuestion.options.map((opt, idx) => {
            const isSelected = selectedAnswers[activeQuestion.id] === opt;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                className={`w-full text-left px-4 py-3 border-2 rounded-none font-sans text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected 
                    ? "border-[#dda15e] text-[#dda15e] bg-[#121e17]" 
                    : "border-[#2a5c30] text-[#C9D7CF] hover:bg-[#121e17] hover:text-[#7ecb8a]"
                }`}
              >
                <span>{opt}</span>
                {isSelected && <span className="font-pixel text-[8px] text-[#dda15e]">🎯 SELECTED</span>}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <p className="font-sans text-xs text-[#bc4749] mb-4 bg-[#2a0d0d]/30 p-2 border border-[#bc4749]">
          ⚠️ {errorMessage}
        </p>
      )}

      {/* Controls */}
      <div className="border-t border-[#2a5c30] pt-5 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="font-pixel text-[8px] bg-[#0c1510] text-[#5a9966] hover:text-[#7ecb8a] border border-[#2a5c30] hover:border-[#7ecb8a] px-4 py-2 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            ◀ PREV
          </button>
          <button
            onClick={handleNext}
            disabled={currentIdx === questions.length - 1}
            className="font-pixel text-[8px] bg-[#0c1510] text-[#5a9966] hover:text-[#7ecb8a] border border-[#2a5c30] hover:border-[#7ecb8a] px-4 py-2 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            NEXT ▶
          </button>
        </div>

        {currentIdx === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="font-pixel text-[9px] bg-[#dda15e] text-[#182320] border-2 border-[#dda15e] hover:bg-transparent hover:text-[#dda15e] px-6 py-2.5 transition-all cursor-pointer shadow-[3px_3px_0px_#000000] active:translate-y-0.5 font-bold"
          >
            {submitting ? "SUBMITTING EXAM..." : "SUBMIT EXAM"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="font-pixel text-[9px] bg-[#1e4a24] text-[#7ecb8a] border-2 border-[#2a5c30] hover:bg-[#7ecb8a] hover:text-[#182320] hover:border-[#7ecb8a] px-6 py-2.5 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            NEXT QUESTION
          </button>
        )}
      </div>
    </div>
  );
};
