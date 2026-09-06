import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Check, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { getAccessToken, loginWithGoogle } from '../lib/firebase';
import { getStoredCompanions } from '../lib/userConfig';

interface ContactItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoURL?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddParticipants: (participants: { name: string; photoURL?: string }[]) => void;
}

export const ContactsPickerModal: React.FC<Props> = ({ isOpen, onClose, onAddParticipants }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    try {
      return localStorage.getItem('milea_contacts_permission_granted') === 'true';
    } catch {
      return false;
    }
  });
  const [permissionType, setPermissionType] = useState<'device' | 'google' | null>(() => {
    try {
      return (localStorage.getItem('milea_contacts_permission_type') as any) || null;
    } catch {
      return null;
    }
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [manualName, setManualName] = useState('');
  const [googleContacts, setGoogleContacts] = useState<ContactItem[]>(() => {
    return getStoredCompanions().map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
    }));
  });
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  useEffect(() => {
    if (isOpen && hasPermission && permissionType === 'google') {
      fetchGoogleContacts();
    }
  }, [isOpen, hasPermission, permissionType]);

  const fetchGoogleContacts = async () => {
    setIsLoadingContacts(true);
    let token = await getAccessToken();
    if (!token) {
      setIsLoadingContacts(false);
      return;
    }
    
    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=100', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const connections = data.connections || [];
        const formatted = connections.map((c: any) => ({
          id: c.resourceName,
          name: c.names?.[0]?.displayName || 'Sem nome',
          email: c.emailAddresses?.[0]?.value || '',
          photoURL: c.photos?.[0]?.url || `https://i.pravatar.cc/100?u=${encodeURIComponent(c.resourceName)}`
        })).filter((c: any) => c.name !== 'Sem nome' || c.email);
        
        if (formatted.length > 0) {
          setGoogleContacts(formatted);
        }
      }
    } catch (e) {
      console.error('Failed to fetch google contacts', e);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  if (!isOpen) return null;

  const handleRequestNativeDevice = async () => {
    try {
      localStorage.setItem('milea_contacts_permission_granted', 'true');
      localStorage.setItem('milea_contacts_permission_type', 'device');
    } catch {}

    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'icon', 'email', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: true });
        if (contacts && contacts.length > 0) {
          const formatted = contacts.map((c: any) => ({
            name: c.name?.[0] || 'Contato do Aparelho',
            photoURL: c.icon?.[0] ? URL.createObjectURL(c.icon[0]) : undefined
          }));
          onAddParticipants(formatted);
          onClose();
          return;
        }
      } catch (err) {
        console.warn("Native Contacts API cancelled or failed:", err);
      }
    }
    // Fallback to simulated device permission
    setPermissionType('device');
    setHasPermission(true);
  };

  const handleRequestGoogleAccount = async () => {
    let token = await getAccessToken();
    if (!token) {
      try {
        await loginWithGoogle();
        token = await getAccessToken();
      } catch (e) {
        console.error('Google login cancelled or failed', e);
      }
    }

    try {
      localStorage.setItem('milea_contacts_permission_granted', 'true');
      localStorage.setItem('milea_contacts_permission_type', 'google');
    } catch {}
    setPermissionType('google');
    setHasPermission(true);

    if (token) {
      fetchGoogleContacts();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmSelected = () => {
    const selected = googleContacts.filter(c => selectedIds.includes(c.id)).map(c => ({
      name: c.name,
      photoURL: c.photoURL
    }));

    if (manualName.trim()) {
      selected.push({
        name: manualName.trim(),
        photoURL: `https://i.pravatar.cc/100?u=${encodeURIComponent(manualName)}`
      });
    }

    if (selected.length > 0) {
      onAddParticipants(selected);
      onClose();
      // Reset state
      setSelectedIds([]);
      setManualName('');
    }
  };

  const filtered = googleContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[110] bg-transparent flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] text-slate-900 dark:text-slate-100 w-full max-w-md rounded-[24px] shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/60 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-white/40 dark:bg-slate-950/40 p-5 relative border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0b1f14] dark:bg-[#384c2e] text-white dark:text-[#f0f7e8] flex items-center justify-center font-bold shadow-sm">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">Adicionar Pessoas</h3>
              <p className="text-[11px] text-slate-500">Selecione acompanhantes para a viagem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-200 dark:bg-slate-800 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!hasPermission ? (
          /* Permission Request View */
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Permissão de Contatos</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Para incluir pessoas nesta viagem, permita o acesso aos contatos do seu aparelho celular ou da sua conta Google.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleRequestGoogleAccount}
                className="w-full py-3 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-[24px] font-bold text-xs flex items-center justify-center gap-3 shadow-md hover:opacity-90 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Permitir Contatos da Conta Google
              </button>

              <button
                type="button"
                onClick={handleRequestNativeDevice}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-[24px] font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Permitir Contatos do Aparelho
              </button>
            </div>
          </div>
        ) : (
          /* Contacts Selector List View */
          <div className="p-5 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[24px] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-lime-400"
              />
            </div>

            {isLoadingContacts ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Sincronizando contatos...</p>
              </div>
            ) : (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filtered.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className={`flex items-center justify-between p-2.5 rounded-[24px] cursor-pointer transition border ${
                      isSelected
                        ? 'bg-lime-400/10 dark:bg-lime-400/20 border-lime-400'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0">
                        <img src={c.photoURL} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.email}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'bg-lime-400 border-lime-400 text-slate-950' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Quick Add Custom Name */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                Ou digite um nome diretamente
              </label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Ex: Pedro Alvares..."
                className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-lime-400"
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmSelected}
                disabled={selectedIds.length === 0 && !manualName.trim()}
                className="w-full py-3 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-[24px] shadow-lg shadow-lime-400/20 transition flex items-center justify-center gap-2"
              >
                Adicionar {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} à Viagem
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
