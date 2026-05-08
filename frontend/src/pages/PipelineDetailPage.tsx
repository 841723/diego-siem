import { Navigate, useParams } from "react-router-dom";

export default function PipelineDetailPage() {
    const { id } = useParams<{ id: string }>();
    if (!id) return <Navigate to='/pipelines' replace />;
    return <Navigate to={`/pipelines/${id}/edit`} replace />;
}
