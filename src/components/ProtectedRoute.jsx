import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ isAuthed, user, children, role }) {
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  // Role restriction
  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}