import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, getApiErrorMessage } from "../lib/api";
import AuthShell from "../components/AuthShell";
import { Alert, Field, Input, PrimaryButton } from "../components/AuthControls";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(
    () => searchParams.get("token") || "",
    [searchParams]
  );
  const navigate = useNavigate();

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/auth/password-reset/confirm", {
        token,
        newPassword,
      });
      navigate("/login");
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
      title="Choose a new password"
      subtitle="Use a strong password you don’t reuse elsewhere."
      footer={
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-semibold text-white/70 hover:text-white transition"
          >
            Back to login
          </Link>
        </div>
      }
    >
      {error ? <Alert tone="error">{error}</Alert> : null}

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <Field label="Reset token" error={fieldErrors.token}>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token"
            className="font-mono text-sm"
          />
        </Field>

        <Field label="New password" error={fieldErrors.newPassword}>
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 chars"
          />
        </Field>

        <Field label="Confirm password" error={fieldErrors.confirmPassword}>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
          />
        </Field>

        <PrimaryButton disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Reset password"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
