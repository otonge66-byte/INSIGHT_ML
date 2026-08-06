export type LearningMode = "Story" | "Sandbox" | "Challenge";

export interface UserProfile {
  id?: string;
  clerk_user_id: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserProgress {
  id?: string;
  clerk_user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  completed_modules: string[];
  completed_challenges: string[];
  total_learning_minutes: number;
  last_activity_date: string | null; // ISO YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
}

export interface LearningSession {
  id?: string;
  clerk_user_id: string;
  module_name: string;
  mode: LearningMode;
  duration_minutes: number;
  xp_earned: number;
  challenge_completed: boolean;
  accuracy?: number | null;
  created_at?: string;
}

export interface DailyActivity {
  id?: string;
  clerk_user_id: string;
  activity_date: string; // ISO YYYY-MM-DD
  xp: number;
  completed_modules: number;
  completed_challenges: number;
  learning_minutes: number;
  streak_counted: boolean;
  created_at?: string;
}

export interface ModuleProgress {
  id?: string;
  clerk_user_id: string;
  module_name: string;
  story_completed: boolean;
  sandbox_completed: boolean;
  challenge_completed: boolean;
  best_accuracy?: number | null;
  best_loss?: number | null;
  best_time?: number | null;
  updated_at?: string;
}

export interface Achievement {
  id?: string;
  clerk_user_id: string;
  achievement_key: string;
  unlocked_at?: string;
}

export interface ProgressSummary {
  profile: UserProfile | null;
  progress: UserProgress;
  sessions: LearningSession[];
  dailyActivity: Record<string, DailyActivity>; // activity_date -> DailyActivity
  moduleProgress: Record<string, ModuleProgress>; // module_name -> ModuleProgress
  achievements: Achievement[];
  totalLearningDays: number;
  completionPercentage: number;
  currentRank: string;
  isSyncError: boolean;
  errorMessage?: string;
}

export const XP_RATES = {
  STORY_MODE: 20,
  SANDBOX_MODE: 10,
  CHALLENGE: 50,
  PERFECT_CHALLENGE: 100, // 3 stars
} as const;
