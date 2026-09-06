import React, { useState, useMemo } from 'react';
import { BaggageItem, BaggageCategory } from '../types';
import {
  Briefcase,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Tv,
  Shirt,
  Sparkles,
  FileText,
  Package,
  Weight,
  Info,
  RotateCcw,
  Check,
  Edit3
} from 'lucide-react';
import { DEFAULT_MASTER_BAGGAGE } from '../lib/masterBaggage';

interface BagagemViewProps {
  masterItems: BaggageItem[];
  onUpdateMasterItems: (items: BaggageItem[]) => void;
}

const CATEGORIES: { name: BaggageCategory; icon: React.FC<{ className?: string }> }[] = [
  { name: 'Eletrônicos', icon: Tv },
  { name: 'Roupas', icon: Shirt },
  { name: 'Higiene', icon: Sparkles },
  { name: 'Documentos', icon: FileText },
  { name: 'Outros', icon: Package },
];

export const BagagemView: React.FC<BagagemViewProps> = ({
  masterItems,
  onUpdateMasterItems,
}) => {
  const [activeCategory, setActiveCategory] = useState<BaggageCategory>('Eletrônicos');
  const [newItemName, setNewItemName] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');

  // Calculate statistics for categories
  const categoryStats = useMemo(() => {
    const stats: Record<BaggageCategory, { total: number; packed: number; weight: number }> = {
      Eletrônicos: { total: 0, packed: 0, weight: 0 },
      Roupas: { total: 0, packed: 0, weight: 0 },
      Higiene: { total: 0, packed: 0, weight: 0 },
      Documentos: { total: 0, packed: 0, weight: 0 },
      Outros: { total: 0, packed: 0, weight: 0 },
    };

    masterItems.forEach((item) => {
      const cat = item.category || 'Outros';
      if (!stats[cat]) {
        stats[cat] = { total: 0, packed: 0, weight: 0 };
      }
      stats[cat].total += 1;
      if (item.packed) stats[cat].packed += 1;
      if (item.weightKg) stats[cat].weight += item.weightKg;
    });

    return stats;
  }, [masterItems]);

  const activeItems = useMemo(() => {
    return masterItems.filter((i) => i.category === activeCategory);
  }, [masterItems, activeCategory]);

  const activeCategoryTotalWeight = useMemo(() => {
    return activeItems.reduce((acc, curr) => acc + (curr.weightKg || 0), 0).toFixed(1);
  }, [activeItems]);

  // Toggle packed item
  const handleToggleItem = (id: string) => {
    const updated = masterItems.map((item) =>
      item.id === id ? { ...item, packed: !item.packed } : item
    );
    onUpdateMasterItems(updated);
  };

  // Add new item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: BaggageItem = {
      id: `master-bag-${Date.now()}`,
      category: activeCategory,
      name: newItemName.trim(),
      note: newItemNote.trim() || undefined,
      weightKg: newItemWeight ? parseFloat(newItemWeight) : undefined,
      packed: false,
    };

    onUpdateMasterItems([...masterItems, newItem]);
    setNewItemName('');
    setNewItemNote('');
    setNewItemWeight('');
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    onUpdateMasterItems(masterItems.filter((item) => item.id !== id));
  };

  // Start Editing Item
  const handleStartEdit = (item: BaggageItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditNote(item.note || '');
  };

  // Save Edit Item
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    const updated = masterItems.map((item) =>
      item.id === id ? { ...item, name: editName.trim(), note: editNote.trim() || undefined } : item
    );
    onUpdateMasterItems(updated);
    setEditingItemId(null);
  };

  // Reset to default template
  const handleResetDefault = () => {
    if (window.confirm('Deseja redefinir a mala padrão para os itens iniciais sugeridos?')) {
      onUpdateMasterItems(DEFAULT_MASTER_BAGGAGE);
    }
  };

  const activeCategoryObj = CATEGORIES.find((c) => c.name === activeCategory) || CATEGORIES[0];
  const ActiveIcon = activeCategoryObj.icon;

  return (
    <div className="w-full max-w-full px-1 sm:px-4 py-2 animate-in fade-in duration-300">
      {/* Top Header Controls (Action Buttons) */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Categorias ({masterItems.length} itens no total)
          </span>
        </div>
        <button
          onClick={handleResetDefault}
          className="px-4 py-2 rounded-full border border-slate-300/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
          title="Restaurar itens padrão iniciais"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Padrão
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        {/* LEFT COLUMN: Categories selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="mb-2 text-left">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Categorias
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Selecione para focar no checklist
            </p>
          </div>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = activeCategory === cat.name;
              const stat = categoryStats[cat.name] || { total: 0, packed: 0, weight: 0 };
              const isDone = stat.total > 0 && stat.packed === stat.total;
              const percentage = stat.total > 0 ? Math.round((stat.packed / stat.total) * 100) : 0;

              return (
                <div
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`relative p-4 rounded-3xl transition-all duration-300 cursor-pointer border flex items-center gap-4 ${
                    isSelected
                      ? 'bg-white dark:bg-[#001f3f]/80 border-[#007ea7] dark:border-[#a3e635] shadow-xl ring-2 ring-[#007ea7]/30 dark:ring-[#a3e635]/40 scale-[1.02]'
                      : 'bg-white/65 dark:bg-[#001f3f]/40 backdrop-blur-[15px] border-white/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white/90 dark:hover:bg-[#001f3f]/60'
                  }`}
                >
                  {/* Circular Category Icon Badge */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors shadow-sm ${
                      isSelected
                        ? 'bg-[#007ea7]/10 dark:bg-[#a3e635]/20 border-[#007ea7]/40 dark:border-[#a3e635]/40 text-[#007ea7] dark:text-[#a3e635]'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>

                  {/* Info & Progress */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </h3>
                      <span className="text-xs font-black text-[#007ea7] dark:text-[#a3e635]">
                        {percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/60 dark:bg-white/10 rounded-full h-1.5 overflow-hidden mb-1.5">
                      <div
                        className="bg-[#007ea7] dark:bg-[#a3e635] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p
                      className={`text-xs font-semibold ${
                        isDone
                          ? 'text-[#007ea7] dark:text-[#a3e635]'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {stat.total === 0
                        ? 'Nenhum item'
                        : isDone
                        ? 'Todos os itens ok!'
                        : `${stat.packed} de ${stat.total} separados`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Category Items List */}
        <div className="lg:col-span-8">
          <div className="bg-white/65 dark:bg-[#001f3f]/50 backdrop-blur-[15px] rounded-3xl border border-white/60 dark:border-white/10 shadow-xl p-6 sm:p-8 flex flex-col justify-between min-h-[540px] text-left">
            <div>
              {/* Header inside Panel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-white/10 pb-5 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007ea7]/10 dark:bg-[#a3e635]/15 border border-[#007ea7]/30 dark:border-[#a3e635]/30 text-xs font-bold uppercase tracking-wider text-[#007ea7] dark:text-[#a3e635] mb-2">
                    <ActiveIcon className="w-3.5 h-3.5" />
                    <span>{activeCategory}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Checklist de Bagagem
                  </h2>
                </div>

                {/* Estimated Weight Badge */}
                <div className="sm:text-right mt-2 sm:mt-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    PESO ESTIMADO DA CATEGORIA
                  </span>
                  <span className="text-2xl font-black text-[#007ea7] dark:text-[#a3e635] leading-none flex items-baseline sm:justify-end gap-1">
                    {activeCategoryTotalWeight}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">kg</span>
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 mb-6">
                {activeItems.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                    <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      Nenhum item cadastrado nesta categoria.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Adicione novos itens abaixo para compor sua mala padrão.
                    </p>
                  </div>
                ) : (
                  activeItems.map((item) => (
                    <div
                      key={item.id}
                      className={`group relative p-4 rounded-[18px] border transition-all duration-200 flex items-center justify-between gap-4 ${
                        item.packed
                          ? 'bg-slate-50/80 dark:bg-[#121316]/40 border-slate-200/60 dark:border-white/5 opacity-80'
                          : 'bg-white dark:bg-[#121316]/80 border-slate-200 dark:border-white/10 shadow-sm hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      {/* Checkbox & Text */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id)}
                          className="text-slate-400 hover:text-[#007ea7] dark:hover:text-[#a3e635] transition cursor-pointer shrink-0"
                        >
                          {item.packed ? (
                            <CheckCircle2 className="w-6 h-6 text-[#007ea7] dark:text-[#a3e635]" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                          )}
                        </button>

                        {editingItemId === item.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-white/10 rounded-lg text-sm text-slate-900 dark:text-white font-bold"
                            />
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Nota..."
                              className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-white/10 rounded-lg text-xs text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="px-3 py-1.5 bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] rounded-lg text-xs font-bold"
                            >
                              Salvar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0" onClick={() => handleToggleItem(item.id)}>
                            <h4
                              className={`font-bold text-sm text-slate-900 dark:text-white transition-all ${
                                item.packed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                              }`}
                            >
                              {item.name}
                            </h4>
                            {item.note && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                {item.note}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Info: Weight & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {item.weightKg !== undefined && (
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                            {item.weightKg} kg
                          </span>
                        )}

                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Form: Add Item */}
            <form onSubmit={handleAddItem} className="pt-4 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`+ Adicionar novo item em ${activeCategory}...`}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#121316]/80 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635] transition"
                  />
                </div>

                <div className="w-full sm:w-40">
                  <input
                    type="text"
                    value={newItemNote}
                    onChange={(e) => setNewItemNote(e.target.value)}
                    placeholder="Nota (ex: 20000mAh)"
                    className="w-full px-3 py-3 rounded-xl bg-slate-100 dark:bg-[#121316]/80 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635] transition"
                  />
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    step="0.1"
                    value={newItemWeight}
                    onChange={(e) => setNewItemWeight(e.target.value)}
                    placeholder="Kg"
                    className="w-full px-3 py-3 rounded-xl bg-slate-100 dark:bg-[#121316]/80 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newItemName.trim()}
                  className="px-5 py-3 rounded-xl bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] font-bold text-xs hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
