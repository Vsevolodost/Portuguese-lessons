import rawLegacy from "./data/legacy.json";
import rawCurriculum from "./data/curriculum.json";
import rawPacks from "./data/packs.json";
import type { LegacyLesson, LessonRef, Unit, Pack, Level } from "./types";
export const legacy = rawLegacy as unknown as LegacyLesson[];
export const packs = rawPacks as unknown as Pack[];
export const units = (rawCurriculum as unknown as Unit[]).map((u) => ({
  ...u,
  pack: packs.find((p) => p.id === u.id && p.reviewStatus === "reviewed"),
}));
export const lessons: LessonRef[] = legacy.map((l, i) => ({
  id: l.id,
  title: l.title,
  level: (l.foundation
    ? "Старт"
    : i < 36
      ? "A1"
      : i < 44
        ? "A2"
        : "B1") as Level,
  kind: l.foundation ? "foundation" : "lesson",
  goal: l.foundation?.goal || l.scene,
  legacy: l,
  minutes: l.foundation
    ? Math.max(
        5,
        Number((l.foundation as any).minutes?.match(/[0-9]+/)?.[0]) || 12,
      )
    : 25,
  prerequisite: i ? legacy[i - 1].id : undefined,
}));
const kinds = [
  ["vocabulary", "Слова и фразы"],
  ["grammar", "Как устроена фраза"],
  ["listening", "Понимаю на слух"],
  ["reading", "Читаю и понимаю"],
  ["writing", "Пишу по ситуации"],
  ["review", "Закрепляю и общаюсь"],
];
for (const u of units)
  if (u.pack)
    for (const [kind, title] of kinds)
      lessons.push({
        id: u.id + "-" + kind,
        unitId: u.id,
        title: title + ": " + u.titleRu,
        level: u.level,
        kind,
        goal: u.pack.overview,
        pack: u.pack,
        prerequisite: u.prerequisite_unit || undefined,
        minutes: 20,
      });
export const byId = (id: string) => lessons.find((l) => l.id === id);
export const levels: Level[] = ["Старт", "A1", "A2", "B1", "B2", "C1", "C2"];
export const knownAudio: Record<string, string> = {};
