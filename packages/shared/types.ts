/**
 * KidsMentor Core Shared Domain Types
 * Single source of truth for frontend, backend API client, and worker contracts.
 */

// --- Authentication & User Governance ---

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

export type ConsentType = "DPDP_ACT_2023" | "COPPA" | "GDPR_K";
export type VerificationMethod = "EMAIL_VERIFIED" | "CARD_AUTH" | "SMS_OTP";

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  verification_method: VerificationMethod;
  terms_version: string;
  is_active: boolean;
  granted_at: string;
  revoked_at?: string | null;
}

export type AgeBand = "6-8" | "9-12" | "13-16";
export type EducationalBoard = "CBSE" | "ICSE" | "STATE" | "IB";
export type SupportedLanguage = "en" | "hi" | "te";

export interface AISettings {
  hint_strictness: "socratic" | "standard" | "guided";
  tone: "encouraging" | "gentle" | "playful";
  quiet_hours_start?: string; // e.g. "21:00"
  quiet_hours_end?: string;   // e.g. "07:00"
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

// --- Curriculum & Mastery ---

export type SubjectCode = "MATHS" | "SCIENCE" | "VALUES";

export interface Subject {
  id: string;
  code: SubjectCode;
  name: string;
  description?: string;
  icon?: string;
  order_index: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  grade: number;
  ncert_chapter?: string;
  description?: string;
  order_index: number;
}

export interface Skill {
  id: string;
  topic_id: string;
  code: string;
  name: string;
  description?: string;
  difficulty_level: number;
}

export interface MasteryState {
  id: string;
  child_id: string;
  skill_id: string;
  p_mastery: number; // Bayesian Knowledge Tracing posterior 0.0 to 1.0
  p_transit: number;
  p_guess: number;
  p_slip: number;
  stability_factor: number;
  consecutive_correct: number;
  last_practiced: string;
  next_review_due: string;
  review_interval_days: number;
}

export type ActivityType = "EXPLAINER" | "GUIDED_PRACTICE" | "QUIZ" | "CHALLENGE" | "REVISION_CARD";

export interface Activity {
  id: string;
  skill_id: string;
  title: string;
  activity_type: ActivityType;
  prompt_text: string;
  sympy_verification_spec?: Record<string, any>;
  rubric?: Record<string, any>;
  difficulty: number;
  xp_reward: number;
}

export interface Attempt {
  id: string;
  activity_id: string;
  child_id: string;
  session_id: string;
  submitted_answer: string;
  is_correct: boolean;
  sympy_verified: boolean;
  hints_used: number;
  time_taken_seconds: number;
  misconception_identified?: string | null;
  created_at: string;
}

// --- Tutoring Session & Orchestration ---

export type SessionType = "ACADEMIC" | "VALUES" | "DIAGNOSTIC";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "TIMED_OUT" | "ESCALATED";
export type MessageSender = "CHILD" | "TUTOR" | "SAFETY" | "SYSTEM";
export type AgentName = "TutorAgent" | "ValuesCoachAgent" | "PlannerAgent" | "AssessorAgent" | "SafetyAgent";

export interface ToolCallRecord {
  id: string;
  message_id: string;
  tool_name: string;
  input_args: Record<string, any>;
  output_result: Record<string, any>;
  execution_time_ms: number;
  verified_by_engine: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender: MessageSender;
  content: string;
  agent_name?: AgentName;
  prompt_version?: string;
  model_id?: string;
  latency_ms?: number;
  created_at: string;
  tool_calls?: ToolCallRecord[];
}

export interface Session {
  id: string;
  child_id: string;
  session_type: SessionType;
  subject_code?: SubjectCode;
  current_skill_id?: string;
  status: SessionStatus;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  xp_earned: number;
  turn_count: number;
}

export interface SessionDetail extends Session {
  messages: Message[];
}

export type SafetySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRISIS";
export type SafetyCategory = "DISTRESS" | "ABUSE" | "BULLYING" | "PII" | "JAILBREAK" | "ANTHROPOMORPHISM" | "SAFE";

export interface SafetyVerdict {
  category: SafetyCategory;
  severity: SafetySeverity;
  passed: boolean;
  redacted_input: string;
  rationale: string;
  childline_escalation_required: boolean;
  parent_alert_required: boolean;
  recommended_safe_response?: string;
}

export interface TurnRequest {
  child_message: string;
  current_activity_id?: string;
  drawing_data_url?: string; // Whiteboard/sketch input
  attachment_url?: string;   // Homework photo
}

export interface TurnResponse {
  session_id: string;
  tutor_message: string;
  agent_name: AgentName;
  prompt_version: string;
  safety_passed: boolean;
  safety_category: SafetyCategory;
  sympy_verified: boolean;
  xp_awarded: number;
  current_streak_days: number;
  suggested_actions?: string[];
  next_activity?: Activity | null;
}

// --- Life Values & Ethics Track ---

export type ValueModuleName = 
  | "GRATITUDE"
  | "KINDNESS"
  | "HONESTY"
  | "EMPATHY"
  | "RESPONSIBILITY"
  | "RESPECT"
  | "PERSEVERANCE"
  | "COURAGE"
  | "SHARING"
  | "ENVIRONMENT"
  | "DIGITAL_CITIZENSHIP"
  | "PEER_PRESSURE";

export interface ValueModule {
  id: string;
  name: ValueModuleName;
  title: string;
  description: string;
  plant_type: string; // e.g. "Sunflower", "Oak Tree"
  icon: string;
  order_index: number;
}

export interface Story {
  id: string;
  module_id: string;
  title: string;
  language: SupportedLanguage;
  age_band: AgeBand;
  content: string;
  reflection_questions: string[];
  author_or_source?: string;
}

export interface Dilemma {
  id: string;
  module_id: string;
  age_band: AgeBand;
  situation: string;
  options: string[];
  open_questions: string[];
}

export type MissionStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

export interface MissionTemplate {
  id: string;
  module_id: string;
  age_band: AgeBand;
  title: string;
  description: string;
  real_world_action: string;
  people_involved: string;
  xp_reward: number;
}

export interface Mission {
  id: string;
  child_id: string;
  template_id: string;
  status: MissionStatus;
  assigned_at: string;
  completed_at?: string | null;
  template?: MissionTemplate;
}

export interface MissionReflection {
  id: string;
  mission_id: string;
  child_id: string;
  reflection_text: string;
  voice_recording_url?: string | null;
  drawing_url?: string | null;
  ollie_feedback?: string | null;
  created_at: string;
}

export interface CharacterGardenItem {
  id: string;
  child_id: string;
  module_id: string;
  growth_stage: number; // 0: Seed, 1: Sprout, 2: Budding, 3: Full Bloom
  total_missions_completed: number;
  last_watered_at: string;
  module?: ValueModule;
}

export interface Streak {
  id: string;
  child_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  streak_freezes_available: number;
  last_active_date: string;
}

export interface Badge {
  id: string;
  child_id: string;
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

// --- Parent Digest & Reports ---

export interface AcademicHighlight {
  subject: string;
  skill: string;
  milestone: string;
  effort_celebration: string;
}

export interface ParentWeeklyDigest {
  child_id: string;
  child_name: string;
  generated_at: string;
  total_sessions: number;
  total_missions_completed: number;
  mastered_skills_count: number;
  conversation_starters: string[];
  growth_mindset_tip: string;
}
