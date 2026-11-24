export type Level = "Старт" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Word = {
  pt: string;
  ru: string;
  example?: string;
  translation?: string;
};
export type Check = {
  id: string;
  kind: "choice";
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  skill: string;
};
export type Pack = {
  id: string;
  level: Level;
  titleRu: string;
  overview: string;
  goals: string[];
  prerequisites: string[];
  words: Word[];
  rules: {
    title: string;
    explanation: string;
    examples: { pt: string; ru: string }[];
  }[];
  dialogue: { speaker: string; pt: string; ru: string }[];
  reading: { title: string; pt: string; ru: string };
  checks: Check[];
  writing: {
    prompt: string;
    model: string;
    translation: string;
    checklist: string[];
  };
  scenario: {
    title: string;
    role: string;
    goal: string;
    opening: string;
    openingRu: string;
    help: string;
    helpRu: string;
  };
  version: number;
  reviewStatus: string;
};
export type LegacyLesson = {
  id: string;
  title: string;
  level: string;
  scene: string;
  idea: string;
  mission: string;
  examples: string[][];
  quiz: [string, string[], number, string][];
  write: [string, string[], string];
  foundation?: {
    goal?: string;
    words: string[][];
    parts: string[][];
    rule: string;
    reading: string;
    dialogue: string[][];
    practice: Record<string, unknown>[];
    tests: Record<string, unknown>[];
    personal?: string;
    review: string[];
  };
};
export type Unit = {
  id: string;
  level: Level;
  title: string;
  titleRu: string;
  unit_number: number;
  grammar_points: string[];
  competency_checklist: string[];
  prerequisite_unit: string | null;
  goals: string[];
  pack?: Pack;
};
export type Answer = {
  value: string | number;
  correct: boolean;
  attempts: number;
  at: string;
  firstCorrect: boolean;
};
export type LessonRecord = {
  index: number;
  answers: Record<string, Answer>;
  drafts: Record<string, string>;
  tokens: number[];
  startedAt: string;
  reviewStartedAt?: string;
  reviewAnswers?: Record<string, Answer>;
  reviewIndex?: number;
  completedAt?: string;
  reviewAt?: string;
  reviewedAt?: string;
  skillEvidence?: Record<string, { correct: number; total: number }>;
};
export type Learner = {
  name: string;
  goal: string;
  minutes: string;
  experience: string;
  onboarded: boolean;
  courseProgress?: Record<string, any>;
  learningPath?: { lesson: string; reason: string; at: string };
  currentLesson?: string;
  v2?: {
    version: 1;
    lessons: Record<string, LessonRecord>;
    current?: string;
    vocabulary: Record<
      string,
      { known: boolean; reviews: number; due: string }
    >;
    conversations: Record<
      string,
      {
        draft: string;
        turns: number;
        messages: {
          role: "user" | "assistant";
          content: string;
          say?: string;
          translation?: string;
          feedback?: string;
        }[];
        finishedAt?: string;
      }
    >;
  };
  [key: string]: any;
};
export type LessonRef = {
  id: string;
  unitId?: string;
  title: string;
  level: Level;
  kind: string;
  goal: string;
  pack?: Pack;
  legacy?: LegacyLesson;
  prerequisite?: string;
  minutes: number;
};
