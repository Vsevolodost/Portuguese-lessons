import storedAudio from "./data/audio.json";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Volume2,
  Pause,
  LoaderCircle,
  ArrowRight,
  Check,
  Sun,
  Moon,
  BookOpen,
  Route,
  ChartNoAxesCombined,
  MapPin,
  UserRound,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { audio } from "./api";
import { useLearner } from "./store";
export function Listen({
  text,
  small = false,
}: {
  text: string;
  small?: boolean;
}) {
  const [status, setStatus] = useState<
      "idle" | "loading" | "playing" | "error"
    >("idle"),
    ref = useRef<HTMLAudioElement | null>(null),
    url = useRef(""),
    request = useRef<AbortController | null>(null),
    utterance = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.getVoices();
    const stop = () => {
      request.current?.abort();
      ref.current?.pause();
      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
        speechSynthesis.cancel();
        utterance.current = null;
      }
      setStatus("idle");
    };
    window.addEventListener("bora:stop-audio", stop);
    return () => {
      window.removeEventListener("bora:stop-audio", stop);
      request.current?.abort();
      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
        speechSynthesis.cancel();
        utterance.current = null;
      }
      ref.current?.pause();
      if (url.current)
        url.current.startsWith("blob:") && URL.revokeObjectURL(url.current);
      url.current = "";
      ref.current = null;
    };
  }, [text]);
  async function play() {
    if (status === "playing") {
      ref.current?.pause();
      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
        speechSynthesis.cancel();
        utterance.current = null;
      }
      setStatus("idle");
      return;
    }
    setStatus("loading");
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      if (!url.current)
        url.current =
          (storedAudio as Record<string, { src: string }>)[
            text.trim().toLocaleLowerCase("pt-BR")
          ]?.src || (await audio(text, controller.signal));
      if (controller.signal.aborted) return;
      const player = (ref.current ??= new Audio());
      player.src = url.current;
      player.onended = () => setStatus("idle");
      await player.play();
      setStatus("playing");
    } catch (e) {
      if (controller.signal.aborted) return;
      const voice =
        typeof speechSynthesis !== "undefined"
          ? speechSynthesis.getVoices().find((v) => /^pt[-_]br$/i.test(v.lang))
          : null;
      if (voice) {
        const spoken = new SpeechSynthesisUtterance(text);
        spoken.voice = voice;
        spoken.lang = "pt-BR";
        spoken.rate = 0.9;
        utterance.current = spoken;
        spoken.onend = () => {
          utterance.current = null;
          setStatus("idle");
        };
        spoken.onerror = () => {
          utterance.current = null;
          setStatus("error");
        };
        speechSynthesis.cancel();
        try {
          speechSynthesis.speak(spoken);
          setStatus("playing");
        } catch {
          utterance.current = null;
          setStatus("error");
        }
      } else setStatus("error");
    }
  }
  if (!/[\p{L}\p{N}]/u.test(text)) return null;
  return (
    <span className="listen-wrap">
      <button
        type="button"
        className={"listen " + (small ? "listen-small" : "")}
        onClick={play}
        disabled={status === "loading"}
        aria-label={
          (status === "playing" ? "Остановить: " : "Послушать: ") + text
        }
      >
        {status === "loading" ? (
          <LoaderCircle className="spin" />
        ) : status === "playing" ? (
          <Pause />
        ) : (
          <Volume2 />
        )}
        {!small &&
          (status === "loading"
            ? "Загружаю…"
            : status === "playing"
              ? "Остановить"
              : "Послушать")}
      </button>
      {status === "error" && (
        <span className="inline-error" role="status">
          Не удалось включить. Попробуй ещё раз.
        </span>
      )}
    </span>
  );
}
export function Button({
  children,
  to,
  onClick,
  secondary = false,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const cls = "button " + (secondary ? "button-secondary " : "") + className;
  return to ? (
    <Link className={cls} to={to}>
      {children}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bora-theme-v1") || "null");
      return saved === null
        ? matchMedia("(prefers-color-scheme: dark)").matches
        : saved === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem(
        "bora-theme-v1",
        JSON.stringify(dark ? "dark" : "light"),
      );
    } catch {}
  }, [dark]);
  return (
    <button
      className="icon-button"
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      onClick={() => setDark(!dark)}
    >
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-symbol">
        <span />
      </span>
      <span>
        bora<span className="brand-caption">português do Brasil</span>
      </span>
    </Link>
  );
}
const nav = [
  ["/", "Учиться", Route],
  ["/program", "Программа", BookOpen],
  ["/dictionary", "Слова", BookOpen],
  ["/progress", "Результаты", ChartNoAxesCombined],
  ["/brazil", "Бразилия", MapPin],
] as const;
function Avatar({ name }: { name: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/avatar?meta=1", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (alive && v?.avatar)
          setSrc(
            "/api/avatar?v=" + encodeURIComponent(v.avatar.updatedAt || ""),
          );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return src ? (
    <img
      className="avatar"
      alt="Твоя фотография"
      src={src}
      onError={() => setSrc("")}
    />
  ) : (
    <span className="avatar">{name[0]}</span>
  );
}
export function Shell({
  children,
  route = "",
}: {
  children: ReactNode;
  route?: string;
}) {
  const { user, saveError, reload } = useLearner();
  return (
    <>
      <header className="site-header">
        <Brand />
        <div className="header-right">
          <span className="language-badge">
            <img src="/assets/brazil-flag.webp" alt="" />
            Португальский · Бразилия
          </span>
          <ThemeToggle />
          <a href="/#account" className="profile">
            <Avatar name={user?.name || "B"} />
            <span>{user?.name || "Войти"}</span>
          </a>
        </div>
      </header>
      <div className="app-layout">
        <aside className="navigation">
          <nav>
            {nav.map(([to, title, Icon]) => (
              <Link
                to={to}
                key={to}
                aria-current={route === to ? "page" : undefined}
              >
                <Icon />
                <span>{title}</span>
              </Link>
            ))}
          </nav>
          <div className="nav-bottom">
            <Link to="/exam">
              Подготовка к Celpe-Bras <ArrowRight size={16} />
            </Link>
            <Link to="/about">О курсе и материалы</Link>
          </div>
        </aside>
        <main id="main" className="main-content">
          {saveError && (
            <div className="save-warning" role="alert">
              <span>{saveError}</span>
              <button onClick={reload}>Загрузить ответы</button>
            </div>
          )}
          {children}
        </main>
      </div>
      <nav className="mobile-navigation">
        {nav.slice(0, 4).map(([to, title, Icon]) => (
          <Link
            to={to}
            key={to}
            aria-current={route === to ? "page" : undefined}
          >
            <Icon />
            <span>{title}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="empty-state">
      <BookOpen />
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export { ArrowRight, ArrowLeft, Check };
