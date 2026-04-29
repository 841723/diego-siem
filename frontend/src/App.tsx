import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LogsPage from "./pages/LogsPage";
import MappingsPage from "./pages/MappingsPage";
import PipelinesPage from "./pages/PipelinesPage";
import SourcesPage from "./pages/SourcesPage";

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Navigate to="/logs" replace />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/sources" element={<SourcesPage />} />
                <Route path="/mappings" element={<MappingsPage />} />
                <Route path="/pipelines" element={<PipelinesPage />} />
                <Route path="*" element={<Navigate to="/logs" replace />} />
            </Route>
        </Routes>
    );
}