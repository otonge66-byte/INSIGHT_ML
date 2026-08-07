import React, { useState, useEffect } from "react";
import { saveVideoQuizResult, upsertVideoProgress } from "@/lib/database/videoService";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface MiniQuizProps {
  videoId: string;
  topic: string;
  userId: string;
  questions: Question[];
  onQuizCompleted: (score: number, passed: boolean) => void;
}

export const MiniQuiz: React.FC<MiniQuizProps> = ({
  videoId,
  topic,
  userId,
  questions,
  onQuizCompleted
}) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Shuffles questions and options once on component mount
  useEffect(() => {
    if (questions && questions.length > 0) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5).map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      }));
      setShuffledQuestions(shuffled);
    }
  }, [questions]);

  const handleSelectOption = (qIdx: number, option: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmit = async () => {
    if (submitted || submitting) return;
    if (Object.keys(selectedAnswers).length < shuffledQuestions.length) {
      alert("Please answer all questions before submitting!");
      return;
    }

    setSubmitting(true);
    let correctCount = 0;
    shuffledQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / shuffledQuestions.length) * 100);
    const passed = finalScore >= 60; // 60% or higher to pass

    try {
      // 1. Save detailed quiz result attempt
      await saveVideoQuizResult(userId, {
        video_id: videoId,
        score: finalScore,
        total_questions: shuffledQuestions.length,
        answers: selectedAnswers,
        passed
      });

      // 2. If passed, mark video watch status as fully complete in Supabase
      if (passed) {
        await upsertVideoProgress(userId, {
          video_id: videoId,
          topic,
          watched: true,
          watch_percentage: 100,
          quiz_completed: true,
          quiz_score: finalScore,
          completed_at: new Date().toISOString()
        });
      }

      setScore(finalScore);
      setSubmitted(true);
      onQuizCompleted(finalScore, passed);
    } catch (e) {
      console.error("[ERROR] Failed to save quiz result:", e);
      alert("Failed to save progress. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
    // Re-shuffle for variety
    const shuffled = [...questions].sort(() => Math.random() - 0.5).map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
    setShuffledQuestions(shuffled);
  };

  if (shuffledQuestions.length === 0) return null;

  return (
    <div className="bg-[#081209] border-4 border-[#1e4023] p-5 sm:p-6 shadow-[6px_6px_0px_#050d07]">
      <h3 className="font-pixel text-[12px] text-[#dda15e] border-b border-[#2a5c30] pb-3 mb-5 uppercase tracking-wider">
        📝 Lesson Mini-Quiz
      </h3>

      <div className="space-y-6">
        {shuffledQuestions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const isCorrect = selected === q.correctAnswer;

          return (
            <div key={qIdx} className="border-b border-[#1e4023]/60 pb-5 last:border-0 last:pb-0">
              <p className="font-pixel text-[10px] text-[#7ecb8a] leading-relaxed mb-3">
                {qIdx + 1}. {q.question}
              </p>

              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, oIdx) => {
                  const isOptSelected = selected === opt;
                  let optStyle = "border-[#2a5c30] text-[#C9D7CF] hover:bg-[#121e17] hover:text-[#7ecb8a]";

                  if (submitted) {
                    if (opt === q.correctAnswer) {
                      optStyle = "border-[#7ecb8a] text-[#7ecb8a] bg-[#1e4a24]/50";
                    } else if (isOptSelected) {
                      optStyle = "border-[#bc4749] text-[#bc4749] bg-[#2a0d0d]/50";
                    } else {
                      optStyle = "border-[#2a5c30]/50 text-[#C9D7CF]/50 pointer-events-none";
                    }
                  } else if (isOptSelected) {
                    optStyle = "border-[#7ecb8a] text-[#7ecb8a] bg-[#121e17]";
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(qIdx, opt)}
                      disabled={submitted}
                      className={`w-full text-left px-4 py-2.5 border-2 rounded-none font-sans text-xs transition-colors cursor-pointer flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {!submitted && isOptSelected && <span className="font-pixel text-[8px] text-[#7ecb8a]">✔</span>}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className={`mt-3 p-3 border-l-4 font-sans text-xs leading-relaxed ${isCorrect ? 'bg-[#121e17] border-[#7ecb8a] text-[#8fc99a]' : 'bg-[#2a0d0d]/20 border-[#bc4749] text-[#e57373]'}`}>
                  <p className="font-pixel text-[8px] uppercase tracking-wider mb-1">
                    {isCorrect ? "⭐ Correct Answer!" : "✕ Incorrect"}
                  </p>
                  <p className="italic mb-1">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control Area */}
      <div className="mt-8 pt-5 border-t border-[#2a5c30] flex flex-col sm:flex-row items-center justify-between gap-4">
        {!submitted ? (
          <>
            <p className="font-sans text-[11px] text-[#56a66a]">
              * You must answer all questions and achieve at least 60% (3/5) to mark this lesson completed.
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto font-pixel text-[9px] bg-[#1e4a24] text-[#7ecb8a] hover:bg-[#7ecb8a] hover:text-[#182320] border-2 border-[#2a5c30] hover:border-[#7ecb8a] px-6 py-2.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5 active:shadow-none font-bold shrink-0 disabled:opacity-50"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT ANSWERS"}
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#121e17] border-2 border-[#2a5c30] p-2.5 text-center">
                <span className="font-pixel text-[8px] text-[#8fc99a] block">QUIZ SCORE</span>
                <span className={`font-vt323 text-2xl font-bold ${score >= 60 ? 'text-[#7ecb8a]' : 'text-[#bc4749]'}`}>
                  {score}% {score >= 60 ? "PASS" : "FAIL"}
                </span>
              </div>
              <p className="font-sans text-xs text-[#8fc99a] max-w-sm">
                {score >= 60 
                  ? "Congratulations! You have passed the quiz and successfully completed this lesson."
                  : "You need at least 60% (3/5) to pass. Click Reset Quiz below to try again!"}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full sm:w-auto font-pixel text-[9px] bg-[#2a0d0d] text-[#bc4749] hover:bg-[#bc4749] hover:text-[#182320] border-2 border-[#bc4749] px-6 py-2.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5 active:shadow-none font-bold shrink-0"
            >
              RESET QUIZ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
