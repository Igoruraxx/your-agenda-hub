import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";

const path = window.location.pathname;
const studentPortalMatch = path.match(/^\/s\/([a-f0-9-]{36})$/i);
const isResetPassword = path === '/reset-password';
const StudentPortal = React.lazy(() => import("./pages/StudentPortal"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));

const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(
  <React.StrictMode>
    {studentPortalMatch ? (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="spinner w-8 h-8" /></div>}>
        <StudentPortal token={studentPortalMatch[1]} />
      </Suspense>
    ) : isResetPassword ? (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="spinner w-8 h-8" /></div>}>
        <ResetPassword />
      </Suspense>
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
