export type DictationState = "idle" | "starting" | "listening" | "stopping";
export function useKeyboardDictation(
  ua: string,
  platform: string,
  touches: number,
) {
  return (
    /iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && touches > 1)
  );
}
export function createDictation({
  Recognition,
  onState,
  onText,
  onError,
  schedule = setTimeout,
  unschedule = clearTimeout,
}: {
  Recognition: any;
  onState: (s: DictationState) => void;
  onText: (s: string) => void;
  onError: (s: string) => void;
  schedule?: any;
  unschedule?: any;
}) {
  let recognizer: any = null,
    generation = 0,
    phase: DictationState = "idle",
    timers: any[] = [];
  const set = (s: DictationState) => {
    phase = s;
    onState(s);
  };
  function clear() {
    for (const t of timers) unschedule(t);
    timers = [];
  }
  function release() {
    clear();
    const r = recognizer;
    recognizer = null;
    generation++;
    if (r) {
      r.onstart = r.onresult = r.onend = r.onerror = r.onspeechend = null;
      try {
        r.abort();
      } catch {}
    }
  }
  function cancel() {
    release();
    set("idle");
  }
  function stop() {
    if (!recognizer) return;
    if (phase === "starting") {
      cancel();
      return;
    }
    if (phase === "stopping") return;
    clear();
    set("stopping");
    const gen = generation;
    timers.push(
      schedule(() => {
        if (gen !== generation) return;
        release();
        set("idle");
      }, 3500),
    );
    try {
      recognizer.stop();
    } catch {
      cancel();
    }
  }
  function start() {
    release();
    if (!Recognition) {
      onError("Диктовка браузера недоступна. Можно написать ответ.");
      set("idle");
      return;
    }
    const gen = generation;
    let heard = false;
    try {
      const r = new Recognition();
      recognizer = r;
      r.lang = "pt-BR";
      r.continuous = false;
      r.interimResults = true;
      const valid = () => gen === generation && recognizer === r;
      set("starting");
      timers.push(
        schedule(() => {
          if (!valid()) return;
          release();
          set("idle");
          onError(
            "Микрофон не запустился. Проверь разрешение или напиши ответ.",
          );
        }, 12000),
      );
      r.onstart = () => {
        if (!valid()) return;
        clear();
        set("listening");
        timers.push(
          schedule(() => {
            if (valid()) stop();
          }, 20000),
        );
      };
      r.onresult = (event: any) => {
        if (!valid()) return;
        const parts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i]?.[0]?.transcript;
          if (typeof text === "string") parts.push(text);
        }
        const text = parts.join(" ").trim().slice(0, 1500);
        if (text) {
          heard = true;
          onText(text);
        }
      };
      r.onspeechend = () => {
        if (valid()) stop();
      };
      r.onend = () => {
        if (!valid()) return;
        release();
        set("idle");
        if (!heard)
          onError("Речь не распознана. Попробуй ещё раз или напиши ответ.");
      };
      r.onerror = (e: any) => {
        if (!valid()) return;
        release();
        set("idle");
        onError(
          e?.error === "not-allowed" || e?.error === "service-not-allowed"
            ? "Доступ к диктовке не разрешён. Проверь настройки микрофона. Можно написать ответ."
            : e?.error === "network"
              ? "Диктовке нужен интернет. Можно написать ответ."
              : "Не удалось распознать речь. Можно написать ответ.",
        );
      };
      r.start();
    } catch {
      release();
      set("idle");
      onError("Не удалось включить микрофон. Можно написать ответ.");
    }
  }
  return {
    start,
    stop,
    cancel,
    dispose: release,
    get state() {
      return phase;
    },
  };
}
