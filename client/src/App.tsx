import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProfileSetup from "./pages/ProfileSetup";
import Discovery from "./pages/Discovery";
import Matches from "./pages/Matches";
import Schedule from "./pages/Schedule";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";

function App() {
  const { isAuthenticated, isReady, profileComplete } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">
            Meets
          </div>
          <div className="mt-2 text-sm text-white/60">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <Login />
          ) : profileComplete ? (
            <Navigate to="/discovery" />
          ) : (
            <Navigate to="/profile-setup" />
          )
        }
      />
      <Route
        path="/signup"
        element={
          !isAuthenticated ? (
            <Signup />
          ) : profileComplete ? (
            <Navigate to="/discovery" />
          ) : (
            <Navigate to="/profile-setup" />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          !isAuthenticated ? <ForgotPassword /> : <Navigate to="/discovery" />
        }
      />
      <Route
        path="/reset-password"
        element={
          !isAuthenticated ? <ResetPassword /> : <Navigate to="/discovery" />
        }
      />

      {/* Protected Routes */}
      <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route
          path="/discovery"
          element={
            profileComplete ? <Discovery /> : <Navigate to="/profile-setup" />
          }
        />
        <Route
          path="/matches"
          element={
            profileComplete ? <Matches /> : <Navigate to="/profile-setup" />
          }
        />
        <Route
          path="/schedule"
          element={
            profileComplete ? <Schedule /> : <Navigate to="/profile-setup" />
          }
        />
        {/* Redirect root to discovery */}
        <Route
          path="/"
          element={
            <Navigate to={profileComplete ? "/discovery" : "/profile-setup"} />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
