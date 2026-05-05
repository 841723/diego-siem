import { Navigate } from "react-router-dom";

/** Mapping is now a single global resource — redirect to the mapping page. */
export default function MappingFormPage() {
    return <Navigate to="/mapping" replace />;
}
