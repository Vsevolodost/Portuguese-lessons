import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mic, Square, Send, ArrowLeft } from "lucide-react";
import { byId } from "./data";
import { useLearner } from "./store";
import { state } from "./domain";
import { request } from "./api";
import { Listen } from "./components";
export function Conversation() {
  const { id = "" } = useParams(),
    lesson = byId(id),
    { user, update } = useLearner(),
    [draft, setDraft] = useState(user?.v2?.conversations[id]?.draft || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [listening, setListening] = useState(false),
    recognizer = useRef<any>(null),
    abort = useRef<AbortController | null>(null),
    active = useRef(true),
    end = useRef<HTMLDivElement>(null);
  const saved = user?.v2?.conversations[id],
    messages = saved?.messages || [];
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      recognizer.current?.abort();
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length]);
  if (!lesson || !user) return <p>Выбери занятие для разговора.</p>;
  function startMic() {
    if (listening) {
      recognizer.current?.stop();
      return;
    }
    const Constructor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Constructor) {
      setError("На этом устройстве диктовка недоступна. Можно написать ответ.");
      return;
    }
    const r = new Constructor();
    recognizer.current = r;
    r.lang = "pt-BR";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (event: any) => {
      if (active.current)
        setDraft((d) => (d + " " + event.results[0][0].transcript).trim());
    };
    r.onend = () => {
      if (active.current) setListening(false);
    };
    r.onerror = () => {
      if (active.current) {
        setListening(false);
        setError("Не удалось услышать. Попробуй ещё раз или напиши ответ.");
      }
    };
    setError("");
    setListening(true);
    try {
      r.start();
    } catch {
      setListening(false);
      setError("Не удалось включить микрофон. Можно написать ответ.");
    }
  }
  async function send() {
    if (!draft.trim() || busy) return;
    const text = draft.trim();
    setBusy(true);
    setError("");
    recognizer.current?.stop();
    const controller = new AbortController();
    abort.current = controller;
    try {
      const result = await request<any>("/api/chat", {
        method: "POST",
        signal: controller.signal,
        body: {
          mode: "practice",
          language: "pt-BR",
          lessonId: id,
          question: text,
          history: messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
        },
      });
      if (!active.current) return;
      const p = result.practice;
      if (!p?.say)
        throw Error("Не удалось продолжить разговор. Попробуй ещё раз.");
      update((u) => {
        const conversations = state(u).conversations,
          c = (conversations[id] ??= { draft: "", turns: 0, messages: [] });
        c.messages.push(
          { role: "user", content: text },
          {
            role: "assistant",
            content: p.say,
            say: p.say,
            translation: p.translation,
            feedback: p.feedback,
          },
        );
        c.messages = c.messages.slice(-12);
        let total = Object.values(conversations).reduce(
          (n, v) => n + v.messages.length,
          0,
        );
        for (const old of Object.keys(conversations))
          while (total > 60 && conversations[old].messages.length > 2) {
            conversations[old].messages.splice(0, 2);
            total -= 2;
          }
        c.draft = "";
        c.turns++;
      });
      setDraft("");
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Не удалось отправить ответ.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <div className="conversation-page">
      <header className="conversation-header">
        <Link className="text-link" to={"/lesson/" + id}>
          <ArrowLeft />К занятию
        </Link>
        <Link className="text-link" to="/">
          Завершить разговор
        </Link>
      </header>
      <div className="conversation-title">
        <span className="eyebrow">Практика по теме</span>
        <h1>{lesson.title}</h1>
        <p>{lesson.legacy?.mission || lesson.goal}</p>
      </div>
      <div className="conversation-messages" role="log" aria-label="Разговор">
        {!messages.length && (
          <article className="message assistant">
            <strong>Давай попробуем вместе</strong>
            <p>
              Напиши одну из фраз занятия. Я отвечу коротко, а если будет трудно
              — объясню по-русски.
            </p>
            <div className="conversation-starters">
              {lesson.legacy?.examples.slice(0, 2).map((e) => (
                <button
                  className="word-chip"
                  key={e[0]}
                  onClick={() => setDraft(e[0])}
                >
                  {e[0]}
                </button>
              ))}
            </div>
          </article>
        )}
        {messages.map((m, i) => (
          <article className={"message " + m.role} key={i}>
            <small>{m.role === "user" ? "Ты" : "Bora"}</small>
            <p lang="pt-BR">{m.say || m.content}</p>
            {m.translation && (
              <p className="message-translation">{m.translation}</p>
            )}
            {m.feedback && <p className="message-feedback">{m.feedback}</p>}
            {m.say && <Listen text={m.say} />}
          </article>
        ))}
        {busy && <p role="status">Bora отвечает…</p>}
        <div ref={end} />
      </div>
      <form
        className="conversation-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="conversation-answer">Твой ответ</label>
        <textarea
          id="conversation-answer"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            update((u) => {
              const c = (state(u).conversations[id] ??= {
                draft: "",
                turns: 0,
                messages: [],
              });
              c.draft = e.target.value;
            });
          }}
          maxLength={1500}
          placeholder="Напиши по-португальски или задай вопрос по-русски"
        />
        <div>
          <button
            className={
              "button button-secondary " + (listening ? "recording" : "")
            }
            type="button"
            onClick={startMic}
          >
            {listening ? <Square /> : <Mic />}
            {listening ? "Остановить" : "Сказать"}
          </button>
          <button className="button" disabled={busy || !draft.trim()}>
            <Send />
            Отправить
          </button>
        </div>
        {listening && (
          <p role="status">
            Слушаю. После диктовки проверь текст и нажми «Отправить».
          </p>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
