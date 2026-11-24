import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Check,
  ArrowUpRight,
  Flag,
  Headphones,
  MessageCircle,
} from "lucide-react";
import { Button, PageHeading, Shell, Listen } from "./components";
import { levels, lessons } from "./data";
import {
  complete,
  due,
  evidence,
  levelNames,
  nextLesson,
  state,
} from "./domain";
import { useLearner } from "./store";
import type { Level } from "./types";
export function Dashboard() {
  const { user } = useLearner();
  if (!user) return null;
  const next = nextLesson(user, lessons),
    done = lessons.filter((l) => complete(user, l)).length,
    review = due(user, lessons);
  return (
    <>
      <PageHeading
        title={"Bora, " + (user.name || "начнём") + "!"}
        description="Небольшое занятие сегодня. Больше уверенности в разговоре завтра."
      />
      <section className="continue-card">
        <div>
          <span className="eyebrow">Твой следующий шаг · {next.level}</span>
          <h2>{next.title}</h2>
          <p>{next.goal}</p>
          <div className="lesson-meta">
            <Clock size={16} />
            {next.minutes} минут <span>·</span> Слова → объяснение → практика
          </div>
          <Button to={"/lesson/" + next.id}>
            Продолжить занятие <ArrowUpRight />
          </Button>
        </div>
        <div className="journey-art" aria-hidden="true">
          <img src="/assets/rio-panorama.webp" alt="" loading="eager" />
          <span className="art-label">
            Um passo de cada vez.<small>Шаг за шагом.</small>
          </span>
        </div>
      </section>
      <div className="stats-row">
        <div>
          <span>{done}</span>
          <p>занятий пройдено</p>
        </div>
        <div>
          <span>
            {lessons.filter((l) => evidence(user, l).mastered).length}
          </span>
          <p>тем закреплено повторением</p>
        </div>
        <div>
          <span>{review.length}</span>
          <p>тем пора повторить</p>
        </div>
      </div>
      <section className="section-heading">
        <div>
          <h2>Первые разговоры</h2>
        </div>
        <Link className="text-link" to="/program">
          Вся программа <ArrowUpRight size={16} />
        </Link>
      </section>
      <div className="lesson-grid">
        {lessons.slice(0, 6).map((l, i) => (
          <Link
            className={"lesson-card " + (complete(user, l) ? "completed" : "")}
            to={"/lesson/" + l.id}
            key={l.id}
          >
            <div className="card-top">
              <span className="lesson-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              {complete(user, l) ? (
                <span className="completed-label">
                  <Check size={14} />
                  Пройдено
                </span>
              ) : (
                <ArrowUpRight size={18} />
              )}
            </div>
            <h3>{l.title}</h3>
            <p>{l.goal}</p>
            <div className="card-bottom">
              <BookOpen size={15} />
              {l.minutes} минут
            </div>
          </Link>
        ))}
      </div>
      <section className="quiet-banner">
        <Headphones />
        <div>
          <h3>Слушай. Пробуй. Спрашивай.</h3>
          <p>
            В каждом занятии — короткие фразы с озвучкой и понятное объяснение
            на русском.
          </p>
        </div>
      </section>
    </>
  );
}
export function Program() {
  const { user } = useLearner(),
    [level, setLevel] = useState<Level>("Старт"),
    [selected, setSelected] = useState("");
  const previewRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (selected) previewRef.current?.scrollIntoView({ block: "start" });
  }, [selected]);
  const chosen = lessons.find((l) => l.id === selected);
  return (
    <>
      <PageHeading
        title="Программа обучения"
        description="Сначала освоим основу. Затем будем читать, слушать и общаться всё увереннее."
      />
      <div className="level-tabs" role="tablist" aria-label="Уровень программы">
        {levels
          .filter((level) => lessons.some((l) => l.level === level))
          .map((l) => (
            <button
              role="tab"
              aria-selected={level === l}
              key={l}
              onClick={() => {
                setLevel(l);
                setSelected("");
              }}
            >
              {l}
            </button>
          ))}
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">{level}</span>
          <h2>{levelNames[level]}</h2>
        </div>
        <span className="muted">
          {lessons.filter((l) => l.level === level).length} занятий доступно
        </span>
      </div>
      {chosen && (
        <section className="lesson-overview" ref={previewRef}>
          <button
            className="close-overview"
            onClick={() => setSelected("")}
            aria-label="Закрыть описание"
          >
            ×
          </button>
          <span className="eyebrow">Занятие {lessons.indexOf(chosen) + 1}</span>
          <h2>{chosen.title}</h2>
          <p>{chosen.goal}</p>
          <p>
            Сначала разберём слова и правило. Затем посмотрим примеры и проверим
            понимание.
          </p>
          <Button to={"/lesson/" + chosen.id}>
            Начать занятие <ArrowUpRight />
          </Button>
        </section>
      )}
      <div className="program-list">
        {lessons
          .filter((l) => l.level === level)
          .map((l) => (
            <button
              key={l.id}
              className={
                "program-item " + (user && complete(user, l) ? "completed" : "")
              }
              onClick={() => setSelected(l.id)}
            >
              <span className="lesson-number">
                {String(lessons.indexOf(l) + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{l.title}</h3>
                <p>{l.goal}</p>
              </div>
              <span>
                {user && complete(user, l) ? <Check /> : <ArrowUpRight />}
              </span>
            </button>
          ))}
      </div>
    </>
  );
}
export function Dictionary() {
  const { user, update } = useLearner(),
    [level, setLevel] = useState<Level>("Старт"),
    [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false);
  const all = Array.from(
      new Map(
        lessons
          .filter((l) => l.level === level)
          .flatMap((l) =>
            (
              l.legacy?.foundation?.words ||
              l.legacy?.expansion?.words ||
              l.legacy?.examples ||
              []
            ).map(
              (w) => [w[0], { pt: w[0], ru: w[1], lesson: l.title }] as const,
            ),
          ),
      ).values(),
    ),
    queue = all.filter(
      (w) =>
        !user?.v2?.vocabulary[w.pt]?.known ||
        Date.parse(user.v2.vocabulary[w.pt].due) <= Date.now(),
    ),
    word = queue[index % Math.max(queue.length, 1)];
  function mark(known: boolean) {
    if (!word) return;
    update((u) => {
      const v = state(u).vocabulary;
      v[word.pt] = {
        known,
        reviews: (v[word.pt]?.reviews || 0) + 1,
        due: new Date(Date.now() + (known ? 3 : 0) * 86400000).toISOString(),
      };
    });
    setFlipped(false);
    if (!known) setIndex((i) => i + 1);
  }
  return (
    <>
      <PageHeading
        title="Мои слова"
        description="По одной карточке за раз. Сначала вспомни значение, затем проверь себя."
      />
      <div className="level-tabs">
        {levels.slice(0, 4).map((l) => (
          <button
            aria-pressed={level === l}
            key={l}
            onClick={() => {
              setLevel(l);
              setIndex(0);
              setFlipped(false);
            }}
          >
            {l === "Старт" ? "Самые простые" : l}
          </button>
        ))}
      </div>
      {word ? (
        <section className="flashcard">
          <span className="eyebrow">
            {word.lesson} · В очереди {queue.length}
          </span>
          <h2 lang="pt-BR">{word.pt}</h2>
          <Listen text={word.pt} />
          {flipped ? (
            <>
              <p className="flashcard-translation">{word.ru}</p>
              <div className="flashcard-actions">
                <Button secondary onClick={() => mark(false)}>
                  Ещё повторю
                </Button>
                <Button onClick={() => mark(true)}>
                  <Check />
                  Помню
                </Button>
              </div>
            </>
          ) : (
            <Button secondary onClick={() => setFlipped(true)}>
              Показать перевод
            </Button>
          )}
        </section>
      ) : (
        <section className="empty-state">
          <Check />
          <h2>На сегодня всё!</h2>
          <p>
            Новые слова встречаются в занятиях. Знакомые вернутся через
            несколько дней.
          </p>
          <Button to="/program">К занятиям</Button>
        </section>
      )}
    </>
  );
}
export function Progress() {
  const { user } = useLearner();
  if (!user) return null;
  const done = lessons.filter((l) => complete(user, l)).length;
  return (
    <>
      <PageHeading
        title="Твои результаты"
        description="Пройти занятие — первый шаг. Закрепить тему — вспомнить её спустя время."
      />
      <div className="progress-hero">
        <span
          className="progress-orbit"
          style={{ "--percent": (done / lessons.length) * 100 + "%" } as any}
        >
          <strong>
            {done}
            <small>из {lessons.length}</small>
          </strong>
        </span>
        <div>
          <h2>Каждое занятие — шаг вперёд</h2>
          <p>
            Проверяем понимание по ответам, а не по количеству открытых страниц.
          </p>
        </div>
      </div>
      <div className="program-list">
        {lessons
          .filter((l) => complete(user, l) || user.v2?.lessons[l.id])
          .map((l) => {
            const e = evidence(user, l);
            return (
              <article className="progress-item" key={l.id}>
                <div>
                  <h3>{l.title}</h3>
                  <p>
                    {e.checked
                      ? e.first + " из " + e.checked + " верно с первой попытки"
                      : "Нет новых ответов для оценки"}
                  </p>
                </div>
                <span className="status-chip">
                  {e.mastered
                    ? "Закреплено"
                    : complete(user, l)
                      ? "Пройдено"
                      : "В процессе"}
                </span>
                <Link
                  className="text-link"
                  to={"/lesson/" + l.id + "?review=1"}
                >
                  Повторить
                </Link>
              </article>
            );
          })}
      </div>
    </>
  );
}
export function About() {
  return (
    <>
      <PageHeading
        title="О Bora"
        description="Бразильский португальский с понятными объяснениями на русском."
      />
      <section className="reading-panel">
        <h2>Открытый учебный проект</h2>
        <p>
          Программа расширяется постепенно. Доступные занятия и план будущих
          разделов отмечены отдельно. Прогресс в занятиях не является
          сертификатом CEFR.
        </p>
        <h2>Аудио</h2>
        <p>
          Для примеров используются записи и синтетический бразильский голос.
          Если голосовой сервис недоступен, приложение может использовать голос
          pt-BR устройства. Синтетическая озвучка не является записью носителя;
          наличие голоса зависит от устройства.
        </p>
        <h2>Исходники и лицензии</h2>
        <p>
          План A1–C2 адаптирован из FreeLingo (artcc), AGPL-3.0. Исходники Bora
          доступны пользователям по той же лицензии. У учебных материалов и
          фотографий могут быть отдельные лицензии.
        </p>
        <a
          className="text-link"
          href="https://github.com/Vsevolodost/Portuguese-lessons"
        >
          Исходный код Bora
        </a>
        <a className="text-link" href="https://github.com/artcc/freelingo">
          FreeLingo
        </a>
      </section>
    </>
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <Shell route={location.pathname}>{children}</Shell>;
}
