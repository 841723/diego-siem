import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LogsPage from "./pages/LogsPage";
import MappingDetailPage from "./pages/MappingDetailPage";
import MappingFormPage from "./pages/MappingFormPage";
import MappingsPage from "./pages/MappingsPage";
import PipelineDetailPage from "./pages/PipelineDetailPage";
import PipelineFormPage from "./pages/PipelineFormPage";
import PipelinesPage from "./pages/PipelinesPage";
import SourceDetailPage from "./pages/SourceDetailPage";
import SourceFormPage from "./pages/SourceFormPage";
import SourcesPage from "./pages/SourcesPage";

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Navigate to="/logs" replace />} />
                <Route path="/logs" element={<LogsPage />} />

                {/* Sources */}
                <Route path="/sources" element={<SourcesPage />} />
                <Route path="/sources/new" element={<SourceFormPage />} />
                <Route path="/sources/:id" element={<SourceDetailPage />} />
                <Route path="/sources/:id/edit" element={<SourceFormPage />} />

                {/* Global Mapping */}
                <Route path="/mapping" element={<MappingsPage />} />
                {/* Legacy redirect: old per-mapping routes → global mapping page */}
                <Route path="/mappings" element={<Navigate to="/mapping" replace />} />
                <Route path="/mappings/new" element={<MappingFormPage />} />
                <Route path="/mappings/:id" element={<MappingDetailPage />} />
                <Route path="/mappings/:id/edit" element={<MappingFormPage />} />

                {/* Pipelines */}
                <Route path="/pipelines" element={<PipelinesPage />} />
                <Route path="/pipelines/new" element={<PipelineFormPage />} />
                <Route path="/pipelines/:id" element={<PipelineDetailPage />} />
                <Route path="/pipelines/:id/edit" element={<PipelineFormPage />} />

                <Route path="*" element={<Navigate to="/logs" replace />} />
            </Route>
        </Routes>
    );
}