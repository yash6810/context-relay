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
    return null;
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