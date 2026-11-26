import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink hover:brightness-110 shadow-[0_6px_20px_-8px_var(--primary)]',
  secondary: 'bg-surface text-ink border border-line hover:border-primary hover:text-primary',
  ghost: 'text-ink-soft hover:text-ink hover:bg-raised',
  danger: 'bg-bad text-white hover:brightness-110',
};
const SIZE = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-14 px-7 text-lg' };

export function Button({ variant = 'primary', size = 'md', className = '', ...p }: ComponentProps<'button'> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-40 disabled:pointer-events-none ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    />
  );
}

export function LinkButton({ to, variant = 'primary', size = 'md', className = '', children }: { to: string; variant?: Variant; size?: keyof typeof SIZE; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ${VARIANT[variant]} ${SIZE[size]} ${className}`}>
      {children}
    </Link>
  );
}

export function Panel({ className = '', children, as: As = 'section' }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' }) {
  return <As className={`rounded-2xl bg-surface border border-line ${className}`}>{children}</As>;
}

export function Bar({ value, max = 1, color = 'var(--primary)', label, className = '' }: { value: number; max?: number; color?: string; label: string; className?: string }) {
  const pct = max ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className={`h-2 rounded-full bg-raised overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, size = 96, stroke = 9, color = 'var(--primary)', children, label }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; label: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--raised)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`h-9 px-3.5 rounded-full text-sm font-medium border transition ${active ? 'bg-primary text-primary-ink border-primary' : 'bg-surface border-line text-ink-soft hover:text-ink hover:border-ink-faint'}`}>
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="hidden sm:inline-block min-w-5 px-1.5 rounded-md border border-line bg-raised text-[11px] font-semibold text-ink-faint text-center">{children}</kbd>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-label={title} className="m-auto w-[min(640px,calc(100vw-24px))] max-h-[min(85dvh,760px)] rounded-2xl bg-surface text-ink border border-line p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="h-9 w-9 rounded-lg text-ink-faint hover:bg-raised" aria-label="Close">✕</button>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </dialog>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-ink-soft max-w-[62ch]">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function Stat({ value, label, sub }: { value: ReactNode; label: string; sub?: ReactNode }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm text-ink-soft">{label}</div>
      {sub && <div className="text-xs text-ink-faint mt-0.5">{sub}</div>}
    </div>
  );
}
