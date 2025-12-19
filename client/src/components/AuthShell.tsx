import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
}>;

export default function AuthShell({ title, subtitle, footer, children }: Props) {
  return (
    <div className="min-h-screen bg-[#07070b] relative overflow-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-rose-500/25 blur-[90px]" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-purple-500/25 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-md px-4 py-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-4 py-2">
            <div className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400">
              Meets
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="p-7">
            <div className="text-center">
              <div className="text-3xl font-black tracking-tight text-white">{title}</div>
              {subtitle && <div className="mt-2 text-sm text-white/65">{subtitle}</div>}
            </div>

            <div className="mt-7">{children}</div>
          </div>

          {footer ? (
            <div className="px-7 py-5 border-t border-white/10 bg-black/10">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


