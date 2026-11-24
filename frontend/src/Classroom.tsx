import { stepSatisfied, graded } from "./step-state";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Listen,
  ThemeToggle,
} from "./components";
import { byId, lessons } from "./data";
import {
  answer,
  finish,
  finishReview,
  normalize,
  record,
  state,
} from "./domain";
import { useLearner } from "./store";

import { stepsFor } from "./lesson-engine";
export function Classroom() {
  const [params] = useSearchParams(),
    review = params.get("review") === "1";
  const { id = "" } = useParams(),
    { user, update, saveError } = useLearner(),
    navigate = useNavigate(),
    lesson = byId(id),
    steps = stepsFor(id),
    [picked, setPicked] = useState<number | null>(null),
    [text, setText] = useState(""),
    [feedback, setFeedback] = useState<boolean | null>(null),
    contentRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const r = user?.v2?.lessons[id];
    if (
      review &&
      r?.reviewAt &&
      Date.parse(r.reviewAt) <= Date.now() &&
      r.reviewStartedAt &&
      Date.parse(r.reviewStartedAt) < Date.parse(r.reviewAt)
    )
      update((u) => {
        const v = record(u, id);
        v.reviewIndex = 0;
        v.reviewAnswers = {};
        v.reviewWritten = {};
        v.reviewStartedAt = new Date().toISOString();
      });
  }, [id, review, user]);
  const activeIndex =
    (review
      ? user?.v2?.lessons[id]?.reviewIndex
      : user?.v2?.lessons[id]?.index) || 0;
  useEffect(() => {
    setText(
      user?.v2?.lessons[id]?.drafts[
        (review ? "review:" : "") + (steps[activeIndex]?.key || activeIndex)
      ] || "",
    );
    setPicked(null);
    setFeedback(null);
  }, [id, review, activeIndex]);
  useLayoutEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeIndex]);
  if (!lesson || !user)
    return (
      <div className="empty-state">
        <h1>Занятие недоступно</h1>
        <Link to="/program">Вернуться к программе</Link>
      </div>
    );
  const r = user.v2?.lessons[id],
    answers = (review ? r?.reviewAnswers : r?.answers) || {},
    index = Math.min((review ? r?.reviewIndex : r?.index) || 0, steps.length),
    step = steps[index],
    done = index >= steps.length,
    next = lessons[lessons.findIndex((l) => l.id === id) + 1];
  function advance(skip = false) {
    update((u) => {
      const rec = record(u, id);
      const at = Math.min(index + 1, steps.length);
      if (review) rec.reviewIndex = at;
      else rec.index = at;
      state(u).current = id;
      if (
        at === steps.length &&
        steps.every((s, i) => stepSatisfied(s, i, rec, review))
      ) {
        if (review) finishReview(u, id);
        else finish(u, id);
      }
    });
    setPicked(null);
    setText("");
    setFeedback(null);
  }
  function submit() {
    if (!step) return;
    const correct =
      step.kind === "choice"
        ? picked === step.correct
        : !!step.answers?.some((a) => normalize(a) === normalize(text));
    update((u) =>
      answer(
        u,
        id,
        step.key || String(index),
        step.kind === "choice" ? picked! : text,
        correct,
        review,
      ),
    );
    setFeedback(correct);
  }
  const checked = step && graded(step.kind),
    writingDone =
      !!step &&
      step.kind === "writing" &&
      stepSatisfied(step, index, r, review),
    allAnswered = steps.every((s, i) => stepSatisfied(s, i, r, review));
  function compareWriting() {
    update((u) => {
      const rec = record(u, id);
      const saved = review ? (rec.reviewWritten ??= {}) : (rec.written ??= {});
      saved[step.key || String(index)] = {
        text,
        submittedAt: new Date().toISOString(),
      };
    });
  }
  return (
    <div className="classroom">
      <header className="classroom-header">
        <Link
          to="/program"
          className="icon-button"
          aria-label="Выйти к занятиям"
        >
          <ArrowLeft />
        </Link>
        <div>
          <small>
            {lesson.level} · {lesson.title}
          </small>
          <div
            className="lesson-progress"
            role="progressbar"
            aria-label="Прогресс занятия"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={index}
          >
            <span style={{ width: (100 * index) / steps.length + "%" }} />
          </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="classroom-content" ref={contentRef}>
        <div className="lesson-paper">
          {!review && r?.completedAt && !done && (
            <p className="muted">
              В урок добавлены материалы и практика. Прежний результат сохранён.
            </p>
          )}
          {done ? (
            <>
              <span className="eyebrow">
                {allAnswered ? "Отличная работа" : "Первый проход завершён"}
              </span>
              <h1>
                {allAnswered ? "Ты справился!" : "Вернёмся к пропущенному?"}
              </h1>
              <p>
                {allAnswered
                  ? lesson.goal
                  : "Пропущенные задания не считаются правильными ответами. Можно спокойно повторить их."}
              </p>
              <div className="finish-actions">
                {allAnswered && next && (
                  <Link className="button" to={"/lesson/" + next.id}>
                    Следующее занятие <ArrowRight />
                  </Link>
                )}
                {!allAnswered && (
                  <button
                    className="button"
                    onClick={() => {
                      const first = steps.findIndex(
                        (s, i) => !stepSatisfied(s, i, r, review),
                      );
                      update((u) => {
                        if (review)
                          record(u, id).reviewIndex = first < 0 ? 0 : first;
                        else record(u, id).index = first < 0 ? 0 : first;
                      });
                    }}
                  >
                    Пройти пропущенные задания
                  </button>
                )}
                <Link
                  className="button button-secondary"
                  to={"/conversation/" + id}
                >
                  Поговорить по теме
                </Link>
                <Link className="text-link" to="/">
                  Вернуться на главную
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">
                Шаг {index + 1} из {steps.length}
              </span>
              <h1>{step.title}</h1>
              {step.text &&
                step.text.split(/\n+/).map((p, i) => (
                  <p className="explanation" key={i}>
                    {p}
                  </p>
                ))}
              {step.listen && <Listen text={step.listen} />}
              <div
                className={
                  "lesson-pairs " +
                  (step.kind === "dialogue" ? "dialogue-pairs" : "")
                }
              >
                {step.pairs?.map((p, i) => (
                  <div className="phrase-card" key={i}>
                    {step.kind === "dialogue" ? (
                      <>
                        <small>{p[0]}</small>
                        <div className="phrase-line">
                          <strong lang="pt-BR">{p[1]}</strong>
                          <Listen text={p[1]} small />
                        </div>
                        <p>{p[2]}</p>
                      </>
                    ) : (
                      <>
                        <div className="phrase-line">
                          <strong lang="pt-BR">{p[0]}</strong>
                          <Listen text={p[0]} small />
                        </div>
                        <p>{p[1]}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {step.kind === "build" && (
                <div className="sentence-builder">
                  <p>{text || "Нажимай слова в правильном порядке"}</p>
                  <div>
                    {step.options?.map((word, i) => (
                      <button
                        className="word-chip"
                        key={i}
                        onClick={() => {
                          setText((t) => (t + " " + word).trim());
                          setFeedback(null);
                        }}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                  <button
                    className="text-link"
                    onClick={() => {
                      setText("");
                      setFeedback(null);
                    }}
                  >
                    Начать фразу заново
                  </button>
                </div>
              )}
              {step.options && step.kind === "choice" && (
                <div className="answer-options">
                  {step.options.map((o, i) => (
                    <button
                      className={
                        "answer-option " +
                        (picked === i ? "selected " : "") +
                        (feedback !== null && picked === i
                          ? feedback
                            ? "correct"
                            : "incorrect"
                          : "")
                      }
                      disabled={feedback === true}
                      key={i}
                      onClick={() => {
                        setPicked(i);
                        setFeedback(null);
                      }}
                    >
                      <span>{i + 1}</span>
                      {o}
                      {feedback === true && picked === i && <Check />}
                    </button>
                  ))}
                </div>
              )}
              {step.kind === "writing" && (
                <section className="writing-work">
                  <label className="write-answer">
                    Твой текст
                    <textarea
                      lang="pt-BR"
                      rows={5}
                      maxLength={1200}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        update((u) => {
                          const rec = record(u, id);
                          rec.drafts[
                            (review ? "review:" : "") + (step.key || index)
                          ] = e.target.value;
                          delete (review ? rec.reviewWritten : rec.written)?.[
                            step.key || String(index)
                          ];
                        });
                      }}
                      placeholder="Начни с одной знакомой фразы"
                    />
                  </label>
                  {writingDone && (
                    <div className="writing-comparison">
                      <h2>Сравни с образцом</h2>
                      <p lang="pt-BR">{step.model?.[0]}</p>
                      <p>{step.model?.[1]}</p>
                      <h3>Проверь свой текст</h3>
                      <ul>
                        {step.checklist?.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                      <p className="muted">
                        Это самостоятельная работа. Совпадать с образцом слово в
                        слово не нужно.
                      </p>
                    </div>
                  )}
                </section>
              )}
              {step.kind === "short" && (
                <label className="write-answer">
                  Твой ответ
                  <input
                    lang="pt-BR"
                    autoComplete="off"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      update((u) => {
                        record(u, id).drafts[
                          (review ? "review:" : "") + (step.key || index)
                        ] = e.target.value;
                      });
                      setFeedback(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && text.trim()) submit();
                    }}
                    placeholder="Напиши по-португальски"
                  />
                </label>
              )}
              {feedback !== null && (
                <div
                  role="status"
                  className={"feedback " + (feedback ? "correct" : "incorrect")}
                >
                  <strong>{feedback ? "Верно!" : "Пока не получилось"}</strong>
                  <p>{step.why}</p>
                </div>
              )}
              {checked && (
                <details className="lesson-help">
                  <summary>Нужна подсказка?</summary>
                  <p>{step.why}</p>
                  <div>
                    {(
                      lesson.legacy?.foundation?.words ||
                      lesson.legacy?.expansion?.words ||
                      lesson.legacy?.examples ||
                      []
                    ).map((w, i) => (
                      <span className="word-chip" key={i}>
                        {w[0]} — {w[1]}
                      </span>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
          {saveError && (
            <p role="alert" className="inline-error">
              {saveError}
            </p>
          )}
        </div>
      </main>
      {!done && (
        <footer className="classroom-footer">
          <div>
            <button className="text-link" onClick={() => advance(true)}>
              Пропустить
            </button>
            <span className="step-counter">
              {index + 1} / {steps.length}
            </span>
            {step.kind === "writing" && !writingDone ? (
              <button
                className="button"
                disabled={!/[a-záéíóúãõâêôç]/i.test(text.trim())}
                onClick={compareWriting}
              >
                Сравнить с образцом
              </button>
            ) : checked && feedback !== true ? (
              <button
                className="button"
                disabled={
                  step.kind === "choice" ? picked === null : !text.trim()
                }
                onClick={submit}
              >
                Проверить
              </button>
            ) : (
              <button className="button" onClick={() => advance()}>
                Продолжить <ArrowRight />
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
