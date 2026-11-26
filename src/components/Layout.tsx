import { useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { displayStreak, levelFromXp } from '../engine/gamification';
import { useStore } from '../store/store';
import { Toasts } from './Toasts';

const NAV = [
  { to: '/', label: 'Home', icon: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/learn', label: 'Learn', icon: 'M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6zm0 0v14.5' },
  { to: '/review', label: 'Review', icon: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4' },
  { to: '/challenges', label: 'Challenges', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4' },
  { to: '/atlas', label: 'Flag Atlas', icon: 'M5 21V4M5 4c5-2 9 2 14 0v10c-5 2-9-2-14 0' },
  { to: '/stats', label: 'Statistics', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { to: '/settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--primary)" />
        <path d="M9 25V7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M10 8c4-2 7 2 12 0v9c-5 2-8-2-12 0z" fill="var(--brass)" />
      </svg>
      <span className="font-display text-lg font-semibold leading-none">FlagMaster<span className="block text-[11px] font-medium text-ink-faint mt-0.5">Road to 195</span></span>
    </span>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const xp = useStore((s) => s.xp);
  const streak = useStore((s) => s.streak);
  const { theme, reducedMotion } = useStore((s) => s.settings);
  const lvl = levelFromXp(xp);

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 h-11 text-[15px] font-medium transition ${isActive ? 'bg-primary-soft text-primary' : 'text-ink-soft hover:text-ink hover:bg-raised'}`;

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:m-3 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">Skip to content</a>

      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-line bg-surface px-4 py-5">
        <NavLink to="/" className="px-2 mb-7" aria-label="FlagMaster home"><Logo /></NavLink>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkCls}>
              <Icon d={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-raised p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Level {lvl.level}</span>
            <span className="text-ink-faint tabular-nums">{lvl.into}/{lvl.span} XP</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden"><div className="h-full bg-brass" style={{ width: `${lvl.pct * 100}%` }} /></div>
          <p className="mt-3 text-sm text-ink-soft">🔥 {displayStreak(streak, Date.now())}-day streak</p>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 backdrop-blur px-4 h-14">
        <NavLink to="/" aria-label="FlagMaster home"><Logo /></NavLink>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span aria-label={`Level ${lvl.level}`}>Lv {lvl.level}</span>
          <span aria-label={`${displayStreak(streak, Date.now())}-day streak`}>🔥 {displayStreak(streak, Date.now())}</span>
          <NavLink to="/settings" aria-label="Settings" className="text-ink-soft"><Icon d={NAV[6].icon} /></NavLink>
        </div>
      </header>

      <main id="main" className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-28 lg:pb-12 max-w-6xl mx-auto">{children}</main>

      <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface/95 backdrop-blur grid grid-cols-6 pb-[env(safe-area-inset-bottom)]">
        {NAV.slice(0, 6).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium ${isActive ? 'text-primary' : 'text-ink-faint'}`}>
            <Icon d={n.icon} />
            <span className="truncate max-w-full px-1">{n.label === 'Flag Atlas' ? 'Atlas' : n.label === 'Statistics' ? 'Stats' : n.label}</span>
          </NavLink>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}
