import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { api, getApiErrorMessage } from "../lib/api";
import AuthShell from "../components/AuthShell";
import { Alert, Field, Input, PrimaryButton } from "../components/AuthControls";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = (() => {
    const pw = password;
    if (!pw) return { score: 0, label: "" };
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const hasSymbol = /[^A-Za-z0-9]/.test(pw);
    const lengthScore = pw.length >= 12 ? 2 : pw.length >= 8 ? 1 : 0;
    const variety = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;
    const score = Math.min(4, lengthScore + variety);
    const label =
      ["Too weak", "Weak", "Okay", "Strong", "Very strong"][score] || "";
    return { score, label };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    if (!accepted) {
      setError("Please accept the terms to continue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/signup", { email, password });
      login(res.data.token, res.data.user, !!res.data.profileComplete);
      navigate("/profile-setup");
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
      title="Create your account"
      subtitle="Set it up now, then jump into your first matches."
      footer={
        <div className="text-center">
          <span className="text-sm text-white/60">
            Already have an account?
          </span>{" "}
          <Link
            to="/login"
            className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-purple-300 hover:opacity-90 transition"
          >
            Log in →
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
            autoComplete="new-password"
            placeholder="At least 8 chars"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-purple-400 transition-all"
                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-white/60">
              {passwordStrength.label}
            </div>
          </div>
        </Field>

        <Field label="Confirm password" error={fieldErrors.confirmPassword}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        <label className="flex items-start gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-rose-400 focus:ring-rose-400/60"
          />
          <span>
            I agree to the{" "}
            <span className="font-semibold text-white">Terms</span> and{" "}
            <span className="font-semibold text-white">Privacy Policy</span>.
          </span>
        </label>

        <PrimaryButton disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create account"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
};

export default Signup;
