import type { Learner, LessonRecord, LessonRef, Answer } from "./types";
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
export function state(u: Learner) {
  return (u.v2 ??= {
    version: 1,
    lessons: {},
    vocabulary: {},
    conversations: {},
  });
}
export function record(u: Learner, id: string): LessonRecord {
  return (state(u).lessons[id] ??= {
    index: 0,
    answers: {},
    drafts: {},
    tokens: [],
    startedAt: new Date().toISOString(),
  });
}
export function legacyDone(u: Learner, l: LessonRef) {
  const r = u.courseProgress?.["pt/" + l.id];
  return l.legacy?.foundation
    ? !!r?.guided?.finishedAt && r.guided.version === 2
    : !!r?.done;
}
export function complete(u: Learner, l: LessonRef) {
  return !!u.v2?.lessons[l.id]?.completedAt || legacyDone(u, l);
}
export function evidence(u: Learner, l: LessonRef) {
  const r = u.v2?.lessons[l.id],
    answers = Object.values(r?.answers || {}),
    checked = answers.length,
    first = answers.filter((a) => a.firstCorrect).length;
  return {
    checked,
    first,
    ratio: checked ? first / checked : 0,
    reviewed: !!r?.reviewedAt,
    mastered:
      !!r?.completedAt &&
      Object.keys(r.reviewAnswers || {}).length >= 3 &&
      Object.values(r.reviewAnswers || {}).filter((a) => a.firstCorrect)
        .length /
        Object.keys(r.reviewAnswers || {}).length >=
        0.8 &&
      !!r.reviewedAt,
  };
}
export function answer(
  u: Learner,
  id: string,
  key: string,
  value: string | number,
  correct: boolean,
  review = false,
) {
  const r = record(u, id),
    answers = review ? (r.reviewAnswers ??= {}) : r.answers,
    previous = answers[key];
  if (review) r.reviewStartedAt ??= new Date().toISOString();
  if (previous?.correct) return;
  answers[key] = {
    value,
    correct,
    attempts: (previous?.attempts || 0) + 1,
    at: new Date().toISOString(),
    firstCorrect: previous ? previous.firstCorrect : correct,
  } satisfies Answer;
}
export function finish(u: Learner, id: string) {
  const r = record(u, id);
  r.completedAt ??= new Date().toISOString();
  r.reviewAt = new Date(Date.now() + 86400000).toISOString();
}
export function due(u: Learner, lessons: LessonRef[]) {
  return lessons.filter((l) => {
    const r = u.v2?.lessons[l.id];
    return r?.completedAt && r.reviewAt && Date.parse(r.reviewAt) <= Date.now();
  });
}
export function nextLesson(u: Learner, lessons: LessonRef[]) {
  return (
    lessons.find((l) => l.id === u.v2?.current && !complete(u, l)) ||
    lessons.find((l) => l.id === u.currentLesson && !complete(u, l)) ||
    lessons.find((l) => !complete(u, l)) ||
    lessons[0]
  );
}
export const levelNames: Record<string, string> = {
  Старт: "С полного нуля",
  A1: "Первые разговоры",
  A2: "Самостоятельно в быту",
  B1: "Разговор на знакомые темы",
  B2: "Обсуждать и аргументировать",
  C1: "Точная и гибкая речь",
  C2: "Тонкости и свободное владение",
};
export function estimate(minutes: number, hours: [number, number]) {
  const daily = Math.max(5, minutes) / 60;
  return hours.map((h) => Math.ceil(h / daily / 30)) as [number, number];
}

export function finishReview(u: Learner, id: string) {
  const r = record(u, id),
    values = Object.values(r.reviewAnswers || {});
  if (
    !r.completedAt ||
    !r.reviewAt ||
    Date.parse(r.reviewAt) > Date.now() ||
    !r.reviewStartedAt ||
    Date.parse(r.reviewStartedAt) < Date.parse(r.reviewAt) ||
    values.length < 3 ||
    values.some((a) => !a.correct)
  )
    return;
  r.reviewedAt = new Date().toISOString();
  r.reviewAt = new Date(Date.now() + 7 * 86400000).toISOString();
}
