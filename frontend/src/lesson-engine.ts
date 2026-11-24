import { byId } from "./data";
type Step = {
  kind:
    "words" | "rule" | "examples" | "dialogue" | "choice" | "short" | "build";
  title: string;
  text?: string;
  pairs?: string[][];
  options?: string[];
  answers?: string[];
  correct?: number;
  why?: string;
  listen?: string;
};
export function stepsFor(id: string): Step[] {
  const l = byId(id)?.legacy;
  if (!l) return [];
  const f = l.foundation;
  const checks = (f?.tests || []).map(
    (q: any) =>
      ({
        kind: q.type === "short" ? "short" : "choice",
        title: q.q,
        options: q.options,
        answers: Array.isArray(q.answer) ? q.answer : undefined,
        correct: typeof q.answer === "number" ? q.answer : undefined,
        why: q.why,
        listen: q.text,
      }) as Step,
  );
  return [
    {
      kind: "words",
      title: "Сначала познакомимся со словами",
      pairs: f?.words?.length ? f.words : l.examples,
    },
    { kind: "rule", title: "Как это работает", text: f?.rule || l.idea },
    ...(f?.reading
      ? [
          {
            kind: "rule",
            title: "Читаем и произносим",
            text: f.reading,
          } as Step,
        ]
      : []),
    { kind: "examples", title: "Разберём на примерах", pairs: l.examples },
    ...(f?.parts?.length
      ? [
          {
            kind: "examples",
            title: "Из чего состоит фраза",
            pairs: f.parts,
          } as Step,
        ]
      : []),
    ...(f?.dialogue?.length
      ? [
          {
            kind: "dialogue",
            title: "Маленький разговор",
            pairs: f.dialogue,
          } as Step,
        ]
      : []),
    ...(f?.practice || []).map(
      (q: any) =>
        ({
          kind: q.type === "build" ? "build" : "choice",
          title: q.q || q.title || "Узнай на слух",
          options: q.options || q.tokens?.slice().reverse(),
          answers: q.type === "build" ? [q.answer] : undefined,
          correct: q.answer,
          why: q.why,
          listen: q.type === "listen" ? q.text : undefined,
        }) as Step,
    ),
    ...(checks.length
      ? checks
      : l.quiz.map(
          (q) =>
            ({
              kind: "choice",
              title: q[0],
              options: q[1],
              correct: q[2],
              why: q[3],
            }) as Step,
        )),
    ...(!checks.length
      ? [
          {
            kind: "short",
            title: l.write[0],
            answers: l.write[1],
            why: l.write[2],
          } as Step,
        ]
      : []),
  ];
}
