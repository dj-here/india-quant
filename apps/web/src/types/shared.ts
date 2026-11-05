/**
 * KidsMentor Web Shared Types
 */

export type UserRole = "PARENT" | "ADMIN" | "REVIEWER";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export type AgeBand = "6-8" | "9-12" | "13-16";
export type EducationalBoard = "CBSE" | "ICSE" | "STATE" | "IB";
export type SupportedLanguage = "en" | "hi" | "te";

export interface AISettings {
  hint_strictness: "socratic" | "standard" | "guided";
  tone: "encouraging" | "gentle" | "playful";
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface ChildProfile {
  id: string;
  parent_id: string;
  nickname: string;
  age_band: AgeBand;
  grade: number;
  board: EducationalBoard;
  language: SupportedLanguage;
  interests: string[];
  avatar_id: string;
  daily_time_limit_mins: number;
  ai_settings: AISettings;
  created_at: string;
  updated_at: string;
}

export type SubjectCode = "MATHS" | "SCIENCE" | "VALUES";

export interface MasteryState {
  id: string;
  child_id: string;
  skill_id: string;
  p_mastery: number;
  stability_factor: number;
  consecutive_correct: number;
  last_practiced: string;
  next_review_due: string;
  review_interval_days: number;
}

export interface Session {
  id: string;
  child_id: string;
  session_type: "ACADEMIC" | "VALUES" | "DIAGNOSTIC";
  subject_code?: SubjectCode;
  current_skill_id?: string;
  status: "ACTIVE" | "COMPLETED" | "TIMED_OUT" | "ESCALATED";
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  xp_earned: number;
  turn_count: number;
}
