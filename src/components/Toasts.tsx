import { useEffect, useMemo } from 'react';
import { play } from '../quiz/sound';
import { useStore, type Toast } from '../store/store';

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({ left: Math.random() * 100, dx: (Math.random() - 0.5) * 200, rot: Math.random() * 720, delay: Math.random() * 0.3, color: ['var(--primary)', 'var(--brass)', 'var(--good)', '#ef4444'][i % 4] })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="absolute top-0 h-2.5 w-1.5 rounded-sm" style={{ left: `${p.left}%`, background: p.color, animation: `confetti 1.6s ${p.delay}s ease-in forwards`, ['--dx' as string]: `${p.dx}px`, ['--rot' as string]: `${p.rot}deg` }} />
      ))}
    </div>
  );
}

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useStore((s) => s.dismissToast);
  useEffect(() => {
    if (t.kind !== 'info') play('win');
    const id = setTimeout(() => dismiss(t.id), 5000);
    return () => clearTimeout(id);
  }, [t, dismiss]);
  return (
    <div role="status" className="anim-rise pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xl w-[min(360px,calc(100vw-32px))]">
      <span className="text-2xl leading-none" aria-hidden>{t.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{t.kind === 'achievement' ? `Achievement: ${t.title}` : t.title}</p>
        {t.body && <p className="text-sm text-ink-soft">{t.body}</p>}
      </div>
      <button onClick={() => dismiss(t.id)} className="text-ink-faint hover:text-ink" aria-label="Dismiss">✕</button>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const celebrate = toasts.some((t) => t.kind === 'achievement' || t.kind === 'level');
  return (
    <>
      {celebrate && <Confetti key={toasts.filter((t) => t.kind !== 'info').map((t) => t.id).join()} />}
      <div className="pointer-events-none fixed z-50 bottom-20 lg:bottom-6 right-4 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => <ToastItem key={t.id} t={t} />)}
      </div>
    </>
  );
}
