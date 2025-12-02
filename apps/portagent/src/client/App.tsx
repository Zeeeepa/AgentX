import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { ChatPage } from "./pages/ChatPage";

/**
 * Protected route wrapper
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Main App component
 */
export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        {/* Redirect root to workspace for now */}
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </AuthProvider>
  );
}
