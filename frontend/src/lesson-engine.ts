import { byId } from "./data";
type Step = {
  key?: string;
  kind:
    | "words"
    | "rule"
    | "examples"
    | "dialogue"
    | "choice"
    | "short"
    | "build"
    | "writing";
  title: string;
  text?: string;
  pairs?: string[][];
  options?: string[];
  answers?: string[];
  correct?: number;
  why?: string;
  listen?: string;
  model?: string[];
  checklist?: string[];
  image?: string;
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
  const base: Step[] = [
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
  const x = l.expansion;
  if (!x) {
    if (f?.personal)
      base.push({
        key: "personal:writing",
        kind: "writing",
        title: "Своя реплика",
        text: f.personal,
        model: f.writingModel || l.examples[0],
        checklist: [
          "Я использовал знакомые слова",
          "В моей фразе понятен смысл",
          "Я сравнил написание с образцом",
        ],
      });
    return base;
  }
  // Keep the first six task indexes stable so saved answers remain attached to their original questions.
  const more: Step[] = [];
  for (let i = 0; i < x.words.length; i += 4)
    more.push({
      kind: "words",
      title: "Слова для темы",
      pairs: x.words.slice(i, i + 4),
    });
  more.push(
    { kind: "rule", title: "Почему фраза устроена так", text: x.rule },
    { kind: "examples", title: "Разберём слова по порядку", pairs: x.parts },
    { kind: "rule", title: "Читаем без спешки", text: x.readingNote },
    {
      kind: "examples",
      title: "Небольшой текст",
      pairs: [[x.reading.pt, x.reading.ru]],
    },
    {
      key: "expanded:reading",
      kind: "choice",
      title: x.reading.question,
      options: x.reading.options,
      correct: x.reading.answer,
      why: "Проверь ответ по тексту: " + x.reading.ru,
    },
    {
      key: "expanded:listening",
      kind: "choice",
      title: "Пойми фразу на слух",
      listen: l.examples[0][0],
      options: [l.examples[0][1], l.examples[1][1]],
      correct: 0,
      why: l.examples[0][0] + " — " + l.examples[0][1],
    },
    {
      key: "expanded:build",
      kind: "build",
      title: "Собери знакомую фразу",
      options: l.examples[0][0].split(/\s+/).reverse(),
      answers: [l.examples[0][0]],
      why: l.examples[0][1],
    },
    {
      key: "expanded:spell",
      kind: "short",
      title: "Вставь пропущенную букву: " + x.spell[0],
      answers: [x.spell[1]],
      why: x.spell[2],
    },
    { kind: "examples", title: "Готовый образец", pairs: [x.model] },
    {
      key: "expanded:writing",
      kind: "writing",
      title: "Теперь напиши о своей ситуации",
      text: x.writing.prompt,
      model: x.model,
      checklist: x.writing.checklist,
    },
  );
  return [...base, ...more];
}
