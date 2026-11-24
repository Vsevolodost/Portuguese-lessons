import {
  createDictation,
  useKeyboardDictation,
  type DictationState,
} from "./dictation";
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
    [micState, setMicState] = useState<DictationState>("idle"),
    [keyboardHelp, setKeyboardHelp] = useState(false),
    mic = useRef<ReturnType<typeof createDictation> | null>(null),
    input = useRef<HTMLTextAreaElement | null>(null),
    requestTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    abort = useRef<AbortController | null>(null),
    active = useRef(true),
    end = useRef<HTMLDivElement>(null),
    viewport = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const fit = () => {
      if (viewport.current) viewport.current.style.height = v.height + "px";
    };
    fit();
    v.addEventListener("resize", fit);
    return () => v.removeEventListener("resize", fit);
  }, []);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) mic.current?.cancel();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  const saved = user?.v2?.conversations[id],
    messages = saved?.messages || [];
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      mic.current?.dispose();
      clearTimeout(requestTimer.current);
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length]);
  if (!lesson || !user) return <p>Выбери занятие для разговора.</p>;
  const listening = micState !== "idle";
  function rememberDraft(text: string) {
    const bounded = text.slice(0, 1500);
    setDraft(bounded);
    update((u) => {
      const c = (state(u).conversations[id] ??= {
        draft: "",
        turns: 0,
        messages: [],
      });
      c.draft = bounded;
    });
  }
  function startMic() {
    if (listening) {
      mic.current?.stop();
      return;
    }
    setError("");
    window.dispatchEvent(new Event("bora:stop-audio"));
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    if (
      useKeyboardDictation(
        navigator.userAgent,
        navigator.platform,
        navigator.maxTouchPoints,
      )
    ) {
      setKeyboardHelp(true);
      input.current?.focus();
      return;
    }
    const prefix = draft.trim();
    mic.current?.dispose();
    mic.current = createDictation({
      Recognition:
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition,
      onState: (s) => {
        if (active.current) setMicState(s);
      },
      onText: (t) => {
        if (active.current) rememberDraft((prefix + " " + t).trim());
      },
      onError: (e) => {
        if (active.current) setError(e);
      },
    });
    mic.current.start();
  }
  function cancelSend() {
    abort.current?.abort();
    clearTimeout(requestTimer.current);
    setBusy(false);
    setError("Запрос отменён. Текст ответа сохранён.");
  }
  async function send() {
    if (!draft.trim() || busy) return;
    const text = draft.trim();
    setBusy(true);
    setError("");
    mic.current?.cancel();
    const controller = new AbortController();
    abort.current = controller;
    const deadline = setTimeout(() => {
      controller.abort();
      if (active.current && abort.current === controller) {
        setBusy(false);
        setError(
          "Ответ задерживается. Твой текст сохранён; попробуй отправить позже.",
        );
      }
    }, 45000);
    requestTimer.current = deadline;
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
      if (!active.current || controller.signal.aborted) return;
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
      clearTimeout(deadline);
      if (abort.current === controller && active.current) setBusy(false);
    }
  }
  return (
    <div className="conversation-page" ref={viewport}>
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
                  onClick={() => rememberDraft(e[0])}
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
        {busy && (
          <div role="status">
            <p>Bora отвечает…</p>
            <button type="button" className="text-link" onClick={cancelSend}>
              Отменить ожидание
            </button>
          </div>
        )}
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
          ref={input}
          readOnly={listening}
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
            disabled={busy}
            onClick={startMic}
          >
            {listening ? <Square /> : <Mic />}
            {micState === "starting"
              ? "Отменить"
              : micState === "stopping"
                ? "Завершаю…"
                : listening
                  ? "Остановить"
                  : "Сказать"}
          </button>
          <button
            className="button"
            disabled={busy || listening || !draft.trim()}
          >
            <Send />
            Отправить
          </button>
        </div>
        {keyboardHelp && (
          <p role="status">
            На iPhone используй микрофон на экранной клавиатуре. Для
            португальской речи выбери португальскую клавиатуру. Затем проверь
            текст и нажми «Отправить».
          </p>
        )}
        {listening && (
          <p role="status">
            {micState === "starting"
              ? "Разреши доступ к микрофону. Запуск можно отменить."
              : micState === "stopping"
                ? "Завершаю диктовку…"
                : "Слушаю до 20 секунд. Затем проверь текст и нажми «Отправить»."}
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
