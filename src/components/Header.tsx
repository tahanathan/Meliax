import React from 'react';
import { UserProfile, ThemeMode } from '../types';
import { loginWithGoogle, logoutUser } from '../lib/firebase';
import {
  MapPin,
  Compass,
  CheckCircle2,
  LogOut,
  Sparkles,
  Globe2,
  Settings,
  Sun,
  Moon,
  Bell,
  SlidersHorizontal,
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  visitedCount: number;
  plannedCount: number;
  checkinsCount: number;
  theme: ThemeMode;
  displayName?: string;
  onOpenAIGenerator: () => void;
  onOpenNewTripModal: () => void;
  onOpenCheckinModal: () => void;
  onOpenCustomization: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  visitedCount,
  plannedCount,
  checkinsCount,
  theme,
  displayName,
  onOpenAIGenerator,
  onOpenNewTripModal,
  onOpenCheckinModal,
  onOpenCustomization,
}) => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
  };

  const userName = displayName
    ? displayName.split(' ')[0]
    : user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.isAnonymous
    ? 'Viajante'
    : 'Convidado';

  return (
    <header className="bg-emerald-950/5 dark:bg-emerald-950/20 backdrop-blur-md sticky top-0 z-30 border-b border-emerald-900/10 dark:border-emerald-800/20 px-4 lg:px-8 py-3.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* User Identity & Weather Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={userName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#4d653d] shadow-md"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#0b1f14] dark:bg-[#384c2e] text-white dark:text-[#f0f7e8] font-bold text-lg flex items-center justify-center shadow-lg">
                  {userName.charAt(0).toUpperCase() || 'V'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
            </div>

            <div>
              <p className="text-[11px] font-medium text-emerald-800/70 dark:text-emerald-400/80 uppercase tracking-wider">
                Viagens & Roteiros
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                Olá, <span className="text-emerald-900 dark:text-[#a8c493] font-extrabold">{userName}</span> 👋
              </h1>
            </div>
          </div>
        </div>

        {/* Settings & User Profile */}
        <div className="hidden md:flex items-center space-x-2.5">
          <button
            onClick={onOpenCustomization}
            title="Customizar cores e tema"
            className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Auth */}
          {user && !user.isAnonymous ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[100px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                title="Sair"
                className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition shadow-sm flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887c-.58 2.31-2.655 4-5.207 4-3.142 0-5.69-2.55-5.69-5.69s2.548-5.688 5.69-5.688c1.373 0 2.628.487 3.615 1.3l2.368-2.368C18.23 3.51 15.38 2.5 12.24 2.5 7.02 2.5 2.78 6.74 2.78 11.96s4.24 9.46 9.46 9.46c5.45 0 9.07-3.83 9.07-9.23 0-.62-.06-1.22-.17-1.905h-8.94z"/>
              </svg>
              {isLoggingIn ? '...' : 'Entrar'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
