/**
 * KidsMentor Global Constants
 */

export const APP_NAME = "KidsMentor";
export const MASCOT_NAME = "Ollie the Owl";
export const MASCOT_TITLE = "AI Learning Companion";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" },
] as const;

export const AGE_BANDS = ["6-8", "9-12", "13-16"] as const;

export const EDUCATIONAL_BOARDS = [
  { code: "CBSE", label: "CBSE (Central Board of Secondary Education)" },
  { code: "ICSE", label: "ICSE / CISCE" },
  { code: "STATE", label: "State Board" },
  { code: "IB", label: "IB / Cambridge International" },
] as const;

export const EMERGENCY_CONTACTS = {
  CHILDLINE_INDIA: "1098",
  KIRAN_MENTAL_HEALTH: "1800-599-0019",
  TELE_MANAS: "14416",
  NATIONAL_EMERGENCY: "112",
} as const;

export const GARDEN_GROWTH_STAGES = [
  { stage: 0, label: "Planted Seed", description: "Just planted with excitement!" },
  { stage: 1, label: "Tender Sprout", description: "Growing after your first reflection." },
  { stage: 2, label: "Budding Blossom", description: "Reaching high with real-world practice." },
  { stage: 3, label: "Radiant Flower", description: "In full, colorful bloom through kindness!" },
] as const;

export const ANTI_DEPENDENCY_RULES = {
  MAX_DAILY_SESSION_MINUTES_DEFAULT: 30,
  MANDATORY_BREAK_INTERVAL_MINUTES: 20,
  FORBIDDEN_PHRASES: [
    "I'll miss you",
    "Why did you leave?",
    "Come back soon",
    "I'm your best friend",
    "Don't tell your parents",
    "I have feelings just like you",
  ],
} as const;

export const AVATAR_OPTIONS = [
  { id: "owl_curious", name: "Ollie the Curious", emoji: "🦉" },
  { id: "lion_courage", name: "Leo the Brave", emoji: "🦁" },
  { id: "dolphin_kind", name: "Daphne the Kind", emoji: "🐬" },
  { id: "fox_clever", name: "Felix the Thinker", emoji: "🦊" },
  { id: "elephant_wise", name: "Ellie the Gentle", emoji: "🐘" },
] as const;
