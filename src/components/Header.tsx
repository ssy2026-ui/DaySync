import React from 'react';
import { Sun, Moon, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeView: 'daily' | 'fourWeeks' | 'templates';
  onViewChange: (view: 'daily' | 'fourWeeks' | 'templates') => void;
  onOpenQuickApply: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user: User | null;
  isAuthLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onOpenQuickApply,
  isDark,
  onToggleTheme,
  user,
  isAuthLoading,
  onSignIn,
  onSignOut
}) => {
  // Privacy-friendly email masking (no personal identification collected)
  const getMaskedEmail = (email?: string | null) => {
    if (!email) return 'Gmail Account';
    const parts = email.split('@');
    if (parts.length !== 2) return 'Gmail Account';
    const name = parts[0];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${parts[1]}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onViewChange('daily')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          Tempo
        </button>

        {/* Zone 2: 3 clear single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 sm:gap-8 text-sm font-medium text-slate-600 dark:text-slate-400 overflow-x-auto py-2">
          <button
            type="button"
            onClick={() => onViewChange('daily')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeView === 'daily'
                ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Daily Focus
          </button>
          <button
            type="button"
            onClick={() => onViewChange('fourWeeks')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeView === 'fourWeeks'
                ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            4-Week Review
          </button>
          <button
            type="button"
            onClick={() => onViewChange('templates')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeView === 'templates'
                ? 'text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Schedule Templates
          </button>
        </nav>

        {/* Zone 3: Theme switch + Gmail Auth + Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Gmail Log-in / Log-out controls */}
          {user ? (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <div className="flex items-center gap-1.5" title="Logged in with Gmail. No personal identification stored.">
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="font-mono text-slate-700 dark:text-slate-300 hidden sm:inline max-w-[130px] truncate">
                  {getMaskedEmail(user.email)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden lg:inline">
                  (Private)
                </span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium pl-1 border-l border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                title="Log out from Gmail session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={isAuthLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Sign in with Gmail (No personal identification collected)"
            >
              {/* Google/Gmail colored icon */}
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>{isAuthLoading ? 'Connecting...' : 'Sign in with Gmail'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenQuickApply}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            Apply Template
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-100 dark:border-slate-800 px-4 py-2 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400">
        <button
          type="button"
          onClick={() => onViewChange('daily')}
          className={`py-1 cursor-pointer ${
            activeView === 'daily'
              ? 'text-slate-950 dark:text-white font-semibold'
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Daily Focus
        </button>
        <button
          type="button"
          onClick={() => onViewChange('fourWeeks')}
          className={`py-1 cursor-pointer ${
            activeView === 'fourWeeks'
              ? 'text-slate-950 dark:text-white font-semibold'
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          4-Week Review
        </button>
        <button
          type="button"
          onClick={() => onViewChange('templates')}
          className={`py-1 cursor-pointer ${
            activeView === 'templates'
              ? 'text-slate-950 dark:text-white font-semibold'
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Templates
        </button>
      </div>
    </header>
  );
};
