import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { api, getApiErrorMessage } from "../lib/api";
import AuthShell from "../components/AuthShell";
import { Alert, Field, Input, PrimaryButton } from "../components/AuthControls";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      login(res.data.token, res.data.user, !!res.data.profileComplete);
      navigate(res.data.profileComplete ? "/discovery" : "/profile-setup");
    } catch (err) {
      const fe = (err as any)?.response?.data?.fieldErrors;
      if (fe && typeof fe === "object") setFieldErrors(fe);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Real connections, no texting."
      footer={
        <div className="flex items-center justify-between">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-white/70 hover:text-white transition"
          >
            Forgot password?
          </Link>
          <Link
            to="/signup"
            className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-purple-300 hover:opacity-90 transition"
          >
            Create account →
          </Link>
        </div>
      }
    >
      {error ? <Alert tone="error">{error}</Alert> : null}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <Field label="Email" error={fieldErrors.email}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" error={fieldErrors.password}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <PrimaryButton disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
};

export default Login;
