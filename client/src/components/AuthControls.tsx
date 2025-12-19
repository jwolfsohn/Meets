import type { PropsWithChildren } from 'react';

export function Field({
  label,
  error,
  children,
}: PropsWithChildren<{ label: string; error?: string }>) {
  return (
    <div>
      <div className="text-[11px] font-black tracking-[0.18em] text-white/55 uppercase mb-2">{label}</div>
      {children}
      {error ? <div className="mt-2 text-xs text-rose-300">{error}</div> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3.5',
        'text-white placeholder:text-white/35',
        'outline-none focus:ring-2 focus:ring-rose-400/60 focus:border-rose-400/40 transition',
        props.className || '',
      ].join(' ')}
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      {...props}
      className={[
        'w-full rounded-2xl px-4 py-3.5 font-black text-white',
        'bg-gradient-to-r from-rose-500 to-purple-600 shadow-[0_18px_40px_rgba(255,71,102,0.22)]',
        'hover:opacity-95 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed',
        props.className || '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function SecondaryLink({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={['text-sm font-semibold text-white/70 hover:text-white transition', props.className || ''].join(' ')}>
      {children}
    </a>
  );
}

export function Alert({ children, tone }: PropsWithChildren<{ tone: 'error' | 'success' }>) {
  const base =
    'rounded-2xl border px-4 py-3 text-sm text-center';
  const theme =
    tone === 'error'
      ? 'border-rose-400/25 bg-rose-500/10 text-rose-200'
      : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100';
  return <div className={[base, theme].join(' ')}>{children}</div>;
}


