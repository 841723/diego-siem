import { Navigate, useParams } from "react-router-dom";

export default function SourceDetailPage() {
    const { id } = useParams<{ id: string }>();
    if (!id) return <Navigate to='/sources' replace />;
    return <Navigate to={`/sources/${id}/edit`} replace />;
}
