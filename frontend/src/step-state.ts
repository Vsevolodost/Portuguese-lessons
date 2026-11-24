import type { LessonRecord } from "./types";
export const graded = (kind: string) =>
  ["choice", "short", "build"].includes(kind);
export function stepSatisfied(
  step: { kind: string; key?: string },
  index: number,
  r: LessonRecord | undefined,
  review = false,
) {
  if (step.kind === "writing") {
    const written = (review ? r?.reviewWritten : r?.written)?.[
      step.key || String(index)
    ];
    return !!written?.submittedAt && !!written.text.trim();
  }
  return (
    !graded(step.kind) ||
    !!(review ? r?.reviewAnswers : r?.answers)?.[step.key || String(index)]
      ?.correct
  );
}
