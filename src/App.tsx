import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProjectForm from "./pages/ProjectForm";
import PrimerView from "./pages/PrimerView";
import GlobalHistory from "./pages/GlobalHistory";
import AuthPage from "./pages/AuthPage";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-fg">
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<PrimerView />} />
        <Route path="/history" element={<GlobalHistory />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Layout>
  );
}