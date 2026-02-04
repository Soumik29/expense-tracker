import { Routes, Route, Navigate } from "react-router-dom";
import Register from "../auth/Register";
import Login from "../auth/Login";
import ExpenseTracker from "./ExpenseTracker"; // Your Dashboard
import { useAuth } from "../utils/useAuth";
import { Spinner } from "./Spinner";

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Protected Route: If logged in, show Tracker, else go to Login */}
      <Route
        path="/"
        element={user ? <ExpenseTracker /> : <Navigate to="/login" replace />}
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default App;
