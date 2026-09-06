import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { loginWithGoogle, logoutUser, loginAsGuest } from '../lib/firebase';
import { LogOut, User, ShieldCheck, ChevronDown, Mail, AlertCircle, CheckCircle2, Settings, ChevronRight } from 'lucide-react';

interface AuthMenuProps {
  user: UserProfile | null;
  onUserChange?: (user: UserProfile | null) => void;
  onOpenSettings?: () => void;
  isHomeTab?: boolean;
}

export const AuthMenu: React.FC<AuthMenuProps> = ({ user, onUserChange, onOpenSettings, isHomeTab = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const googleUser = await loginWithGoogle();
      if (googleUser && onUserChange) {
        onUserChange({
          uid: googleUser.uid,
          email: googleUser.email,
          displayName: googleUser.displayName || 'Viajante',
          photoURL: googleUser.photoURL,
          isAnonymous: googleUser.isAnonymous || false,
        });
      }
      setIsOpen(false);
    } catch (error: any) {
      console.error('Falha ao entrar com Google:', error);
      setErrorMessage(
        'Pop-up de login via Google não pôde ser exibido (bloqueado pelo navegador ou iframe). Digite seu e-mail abaixo para acessar diretamente:'
      );
      setShowEmailForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const displayName = nameInput.trim() || emailInput.split('@')[0] || 'Viajante';
    const customUser: UserProfile = {
      uid: `usr_${emailInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      email: emailInput.trim(),
      displayName: displayName,
      photoURL: null,
      isAnonymous: false,
    };

    try {
      localStorage.setItem('voyager_custom_user', JSON.stringify(customUser));
    } catch (e) {}

    if (onUserChange) {
      onUserChange(customUser);
    }

    setIsOpen(false);
    setShowEmailForm(false);
    setErrorMessage(null);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      localStorage.removeItem('voyager_custom_user');
      await logoutUser();
      const guest = await loginAsGuest();
      if (onUserChange && guest) {
        onUserChange({
          uid: guest.uid,
          displayName: guest.displayName || 'Viajante Convidado',
          email: guest.email,
          photoURL: guest.photoURL,
          isAnonymous: guest.isAnonymous ?? true,
        });
      }
      setIsOpen(false);
      setShowEmailForm(false);
    } catch (error) {
      console.error('Falha ao sair:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isGoogleUser = Boolean(user?.email && !user.email.includes('anonymous'));

  return (
    <div className="relative z-50" ref={menuRef}>
      {/* Trigger Button replacing static greeting */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full border backdrop-blur-[15px] shadow-md transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer relative z-50 ${
          isHomeTab
            ? 'bg-white/65 dark:bg-[#001f3f]/50 border-white/60 dark:border-white/10 text-slate-900 dark:text-white hover:bg-white/90 dark:hover:bg-[#001f3f]/70'
            : 'bg-white/65 dark:bg-[#001f3f]/60 border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-[#001f3f]/80'
        }`}
        title="Menu de Login e Perfil"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Usuário'}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#007ea7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
        )}

        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold leading-none flex items-center gap-1">
            {isGoogleUser ? (
              <span className="truncate max-w-[110px]">{user?.displayName?.split(' ')[0] || 'Viajante'}</span>
            ) : (
              <span>Entrar / Login</span>
            )}
          </span>
          <span className="text-[9px] font-medium opacity-70 leading-tight">
            {isGoogleUser ? 'Conta Conectada' : 'Acessar Conta'}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] border border-white/60 dark:border-white/10 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl p-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-slate-100">
          {/* Header Card Profile Info */}
          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                className="w-12 h-12 rounded-full object-cover shadow-sm border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold truncate text-slate-900 dark:text-white">
                {user?.displayName || 'Viajante Convidado'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'Modo Navegação Convidado'}
              </p>
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>{isGoogleUser ? 'Conta Verificada' : 'Sessão Convidado'}</span>
              </div>
            </div>
          </div>

          {/* Warning Message if Google popup failed */}
          {errorMessage && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-snug flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action List */}
          <div className="space-y-2">
            {/* Ajustes / Configurações Button inside User Menu */}
            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                  <span>Ajustes & Configurações</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {!isGoogleUser && (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {/* Google Multicolor SVG Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Conectando...' : 'Entrar com o Google'}</span>
                </button>

                {!showEmailForm ? (
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="w-full text-center py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Ou entrar com Nome / E-mail</span>
                  </button>
                ) : (
                  <form onSubmit={handleManualLoginSubmit} className="space-y-2 pt-1 border-t border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acessar com E-mail</p>
                    <input
                      type="text"
                      placeholder="Seu nome (ex: Nathan)"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007ea7]"
                    />
                    <input
                      type="email"
                      required
                      placeholder="seuemail@exemplo.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007ea7]"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-[#007ea7] dark:bg-[#a3e635] hover:opacity-90 text-white dark:text-[#001f3f] font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar Login</span>
                    </button>
                  </form>
                )}
              </>
            )}

            {isGoogleUser && (
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#001f3f]/80 dark:bg-[#001f3f]/70 backdrop-blur-[15px] border border-white/20 text-white font-bold text-xs hover:bg-[#001f3f] hover:border-white/40 transition shadow-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar / Sair</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
