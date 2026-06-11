import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AcceptInvitation from "./Components/AcceptInvitation";
import Dashboard from "./Components/Dashboard";
import Login from "./Components/Login";
import PublicCheckout from "./Components/PublicCheckout";
import Register from "./Components/Register";
import { SettingsProvider } from "./SettingsContext";

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  return localStorage.getItem("token") ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  return (
    <SettingsProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/accept" element={<AcceptInvitation />} />
        <Route path="/checkout/:token" element={<PublicCheckout />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard view="dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Dashboard view="clients" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <Dashboard view="invoices" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Dashboard view="payments" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <Dashboard view="subscriptions" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Dashboard view="team" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SettingsProvider>
  );
}

export default App;
