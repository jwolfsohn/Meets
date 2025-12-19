import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../lib/api';
import AuthShell from '../components/AuthShell';
import { Alert, Field, Input, PrimaryButton } from '../components/AuthControls';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage(null);
    setDevToken(null);
    setIsSubmitting(true);
    try {
      const res = await api.post('/api/auth/password-reset/request', { email });
      setMessage('If an account exists for that email, you’ll get a reset link.');
      if (res.data?.resetToken) setDevToken(String(res.data.resetToken));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="We’ll send a reset link if the email exists."
      footer={
        <div className="text-center">
          <Link to="/login" className="text-sm font-semibold text-white/70 hover:text-white transition">
            Back to login
          </Link>
        </div>
      }
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      {message ? <div className="mt-4"><Alert tone="success">{message}</Alert></div> : null}

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <PrimaryButton disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </PrimaryButton>
      </form>

      {devToken && (
        <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
          <div className="text-[11px] font-black tracking-[0.18em] uppercase text-amber-200">Dev mode</div>
          <div className="mt-2 text-sm text-amber-100/90">
            Reset token: <span className="font-mono break-all">{devToken}</span>
          </div>
          <div className="mt-3">
            <Link
              className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-purple-300 hover:opacity-90 transition"
              to={`/reset-password?token=${encodeURIComponent(devToken)}`}
            >
              Continue to reset →
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;


