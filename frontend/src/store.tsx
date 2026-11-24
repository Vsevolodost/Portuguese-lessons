import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, session, ApiError } from "./api";
import type { Learner } from "./types";
type Store = {
  user: Learner | null;
  loading: boolean;
  error: string;
  saveError: string;
  update: (fn: (u: Learner) => void) => void;
  reload: () => void;
  csrfReady: boolean;
};
const Context = createContext<Store>(null!);
export function LearnerProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient(),
    [local, setLocal] = useState<Learner | null>(null),
    localRef = useRef<Learner | null>(null),
    [saveError, setSaveError] = useState("");
  const revision = useRef(0),
    pending = useRef<Learner | null>(null),
    inflight = useRef(false),
    paused = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    failures = useRef(0),
    owner = useRef<string | undefined>(undefined),
    generation = useRef(0);
  const auth = useQuery({
    queryKey: ["session"],
    queryFn: session,
    retry: false,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const id = auth.data?.user?.id;
    if (owner.current !== id) {
      owner.current = id;
      generation.current++;
      clearTimeout(timer.current);
      localRef.current = null;
      setLocal(null);
      pending.current = null;
      paused.current = false;
      revision.current = 0;
    }
  }, [auth.data?.user?.id]);
  const progress = useQuery({
    queryKey: ["progress", auth.data?.user?.id],
    queryFn: () =>
      request<{ state: Learner | null; revision: number }>("/api/progress"),
    enabled: !!auth.data?.user && !auth.data?.recovery,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (progress.data) {
      revision.current = progress.data.revision;
      const next = progress.data.state || {
        name: "",
        goal: "Общение с бразильцами",
        minutes: "30",
        experience: "С нуля",
        onboarded: true,
      };
      localRef.current = next;
      setLocal(next);
      paused.current = false;
      setSaveError("");
    }
  }, [progress.data]);
  async function flush() {
    if (inflight.current || paused.current || !pending.current) return;
    inflight.current = true;
    const snapshot = pending.current,
      gen = generation.current;
    pending.current = null;
    try {
      const result = await request<{ revision: number }>("/api/progress", {
        method: "PUT",
        body: { state: snapshot, revision: revision.current },
      });
      if (gen !== generation.current) return;
      revision.current = result.revision;
      failures.current = 0;
      setSaveError("");
    } catch (e) {
      if (gen !== generation.current) return;
      pending.current = pending.current || snapshot;
      failures.current++;
      if (e instanceof ApiError && e.status === 409) {
        paused.current = true;
        setSaveError(
          "На другом устройстве есть новые ответы. Загрузи их перед продолжением.",
        );
      } else
        setSaveError(
          "Не удалось сохранить ответы. Проверь интернет. Повторим сохранение автоматически.",
        );
    } finally {
      inflight.current = false;
      if (pending.current && !paused.current)
        timer.current = setTimeout(
          flush,
          failures.current
            ? Math.min(30000, 2000 * 2 ** failures.current)
            : 400,
        );
    }
  }
  function update(fn: (u: Learner) => void) {
    if (!localRef.current || paused.current) return;
    const next = structuredClone(localRef.current);
    fn(next);
    localRef.current = next;
    setLocal(next);
    pending.current = structuredClone(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 400);
  }
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (pending.current || inflight.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => {
      window.removeEventListener("beforeunload", guard);
      clearTimeout(timer.current);
    };
  }, []);
  function reload() {
    if (
      pending.current &&
      !window.confirm(
        "Загрузить сохранённые ответы? Последние изменения этого устройства будут заменены.",
      )
    )
      return;
    paused.current = false;
    pending.current = null;
    client.invalidateQueries({ queryKey: ["progress"] });
  }
  return (
    <Context.Provider
      value={{
        user: auth.data?.user && !auth.data?.recovery ? local : null,
        loading: auth.isLoading || (!!auth.data?.user && progress.isLoading),
        error: auth.error?.message || progress.error?.message || "",
        saveError,
        update,
        reload,
        csrfReady: !!auth.data,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useLearner = () => useContext(Context);
