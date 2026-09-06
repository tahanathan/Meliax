import React, { useState, useRef } from 'react';
import { Trip } from '../types';
import { Camera, X, Check, Upload, Link as LinkIcon, Image as ImageIcon, Sparkles } from 'lucide-react';

interface SelectingCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onSelectCover: (coverUrl: string) => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
];

export const SelectingCoverModal: React.FC<SelectingCoverModalProps> = ({
  isOpen,
  onClose,
  trip,
  onSelectCover,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'presets' | 'upload'>('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const galleryPhotos = Array.from(
    new Set([
      ...(trip.gallery || []),
      ...(trip.coverImage ? [trip.coverImage] : []),
    ].filter(Boolean))
  );

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onSelectCover(customUrl.trim());
    setCustomUrl('');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSelectCover(reader.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-[250] bg-transparent flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] border border-white/60 dark:border-white/10 rounded-[24px] max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#007ea7]/10 text-[#007ea7] dark:bg-[#a3e635]/20 dark:text-[#a3e635] flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Capa da Viagem</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione uma foto da galeria, envie uma nova imagem ou escolha dos modelos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white flex items-center justify-center transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 px-4 pt-2 bg-slate-50/50 dark:bg-[#18191c] gap-2">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'border-[#007ea7] text-[#007ea7] dark:border-[#a3e635] dark:text-[#a3e635] bg-white dark:bg-[#121316]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Fotos da Viagem ({galleryPhotos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-[#007ea7] text-[#007ea7] dark:border-[#a3e635] dark:text-[#a3e635] bg-white dark:bg-[#121316]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modelos em Destaque</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-[#007ea7] text-[#007ea7] dark:border-[#a3e635] dark:text-[#a3e635] bg-white dark:bg-[#121316]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar / URL</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 scrollbar-thin bg-white dark:bg-[#121316]">
          {/* TAB 1: Gallery */}
          {activeTab === 'gallery' && (
            <div>
              {galleryPhotos.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[24px]">
                  <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nenhuma foto salva nesta viagem ainda
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Você pode escolher uma foto dos modelos ou enviar uma nova do seu dispositivo.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] text-xs font-bold rounded-xl shadow-md hover:scale-105 transition cursor-pointer"
                  >
                    Enviar Imagem Agora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {galleryPhotos.map((url, idx) => {
                    const isCurrent = trip.coverImage === url;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          onSelectCover(url);
                          onClose();
                        }}
                        className={`group relative h-36 rounded-[24px] overflow-hidden cursor-pointer border-2 transition-all shadow-md ${
                          isCurrent
                            ? 'border-[#007ea7] dark:border-[#a3e635] ring-4 ring-[#007ea7]/20 dark:ring-[#a3e635]/20 scale-[1.02]'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/40 hover:scale-[1.02]'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Galeria ${idx}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {isCurrent && (
                          <div className="absolute top-2 right-2 bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-lg">
                            <Check className="w-3 h-3" /> Capa Atual
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] text-xs font-bold px-3 py-1 rounded-xl shadow-lg">
                            Definir como Capa
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Presets */}
          {activeTab === 'presets' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {PRESET_COVERS.map((url, idx) => {
                  const isCurrent = trip.coverImage === url;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelectCover(url);
                        onClose();
                      }}
                      className={`group relative h-36 rounded-[24px] overflow-hidden cursor-pointer border-2 transition-all shadow-md ${
                        isCurrent
                          ? 'border-[#007ea7] dark:border-[#a3e635] ring-4 ring-[#007ea7]/20 dark:ring-[#a3e635]/20 scale-[1.02]'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/40 hover:scale-[1.02]'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${idx}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {isCurrent && (
                        <div className="absolute top-2 right-2 bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-lg">
                          <Check className="w-3 h-3" /> Capa Atual
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] text-xs font-bold px-3 py-1 rounded-xl shadow-lg">
                          Usar esta Capa
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Upload & Custom URL */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* File upload from computer */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#007ea7] dark:hover:border-[#a3e635] rounded-[24px] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50 dark:bg-[#1a1c1e] transition hover:bg-slate-100 dark:hover:bg-[#202226]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#007ea7]/10 text-[#007ea7] dark:bg-[#a3e635]/20 dark:text-[#a3e635] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Clique para selecionar uma foto do seu computador ou celular
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    PNG, JPG, WEBP até 10MB
                  </p>
                </div>
              </div>

              {/* URL Form */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635]" />
                  <span>Ou cole o link direto de uma imagem na internet:</span>
                </label>
                <form onSubmit={handleApplyCustomUrl} className="flex gap-2 mt-2">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-slate-100 dark:bg-[#1a1c1e] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                  />
                  <button
                    type="submit"
                    disabled={!customUrl.trim()}
                    className="bg-[#007ea7] hover:bg-[#006688] dark:bg-[#a3e635] dark:hover:bg-[#b2f746] disabled:opacity-50 text-white dark:text-[#121f00] font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-md"
                  >
                    Aplicar
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
