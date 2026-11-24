import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/manrope";
import "./styles.css";
import { LearnerProvider, useLearner } from "./store";
import { Conversation } from "./Conversation";
import { Classroom } from "./Classroom";
import { Dashboard, Program, Dictionary, Progress, About, Page } from "./pages";
import { Brand, PageHeading, Button } from "./components";
const client = new QueryClient();
function Lesson() {
  const { id } = useParams();
  return <Classroom key={id} />;
}
function LegacySection({ route }: { route: string }) {
  React.useEffect(() => {
    window.location.replace("/#" + route);
  }, [route]);
  return <p role="status">Открываем раздел…</p>;
}
function MissingPage() {
  return (
    <Page>
      <PageHeading title="Страница не найдена" />
      <Button to="/">К занятиям</Button>
    </Page>
  );
}
function App() {
  const { user, loading, error } = useLearner();
  if (loading)
    return (
      <main className="loading-page">
        <Brand />
        <p role="status">Открываем твои занятия…</p>
      </main>
    );
  if (!user)
    return (
      <main className="loading-page">
        <Brand />
        <h1>Продолжим учиться?</h1>
        <p>
          {error ||
            "Войди в свой аккаунт, чтобы открыть занятия и сохранить прогресс."}
        </p>
        <a className="button" href="/#account/login">
          Войти в Bora
        </a>
      </main>
    );
  if (!user.onboarded) return <LegacySection route="start" />;
  return (
    <Routes>
      <Route path="/account" element={<LegacySection route="account" />} />
      <Route path="/brazil" element={<LegacySection route="brazil" />} />
      <Route path="/exam" element={<LegacySection route="exam" />} />
      <Route path="/conversation/:id" element={<Conversation />} />
      <Route path="/lesson/:id" element={<Lesson />} />
      <Route
        path="/"
        element={
          <Page>
            <Dashboard />
          </Page>
        }
      />
      <Route
        path="/program"
        element={
          <Page>
            <Program />
          </Page>
        }
      />
      <Route
        path="/dictionary"
        element={
          <Page>
            <Dictionary />
          </Page>
        }
      />
      <Route
        path="/progress"
        element={
          <Page>
            <Progress />
          </Page>
        }
      />
      <Route
        path="/about"
        element={
          <Page>
            <About />
          </Page>
        }
      />
      <Route path="*" element={<MissingPage />} />
    </Routes>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter basename="/learn">
        <LearnerProvider>
          <App />
        </LearnerProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
