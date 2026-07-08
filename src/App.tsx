import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProjectForm from "./pages/ProjectForm";
import PrimerView from "./pages/PrimerView";
import GlobalHistory from "./pages/GlobalHistory";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<PrimerView />} />
        <Route path="/history" element={<GlobalHistory />} />
      </Routes>
    </Layout>
  );
}