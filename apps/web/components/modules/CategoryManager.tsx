'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { api } from '@/lib/api';

type Category = {
  id: string;
  name: string;
  color: string;
  budget: number | null;
  currency: 'PEN' | 'USD';
};

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

const categorySchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color hex inválido"),
  budget: z.number().nullable().optional(),
  currency: z.enum(['PEN', 'USD']).optional(),
});

export default function CategoryManager() {
  const t = useTranslations('categories');
  const common = useTranslations('common');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [budget, setBudget] = useState<string>('');
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setColor(category.color);
      setBudget(category.budget ? String(category.budget) : '');
      setCurrency(category.currency || 'PEN');
    } else {
      setEditingCategory(null);
      setName('');
      setColor('#10b981');
      setBudget('');
      setCurrency('PEN');
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingCategory(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const budgetNum = budget ? parseFloat(budget) : null;
    const result = categorySchema.safeParse({ name, color, budget: budgetNum, currency });
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => (formattedErrors[i.path[0]] = i.message));
      setErrors(formattedErrors);
      return;
    }
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, result.data);
      } else {
        await api.post('/categories', result.data);
      }
      await fetchCategories();
      closeModal();
    } catch (e) {
      console.error("Error saving category");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      try {
        await api.delete(`/categories/${id}`);
        await fetchCategories();
      } catch (e) {
        console.error("Error deleting category");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('title')}</h2>
          <p className="text-sm text-gray-500">Gestiona tus categorías y presupuestos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-emerald-200"
        >
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      {/* Category grid */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">{common('loading')}</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag size={24} />
          </div>
          <p className="text-gray-500">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all group overflow-hidden relative"
            >
              {/* Color accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: cat.color }} />
              <div className="flex justify-between items-start mb-4 mt-1">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${cat.color}22`, border: `1.5px solid ${cat.color}55` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(cat)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('budget')}</p>
                <p className="text-lg font-bold" style={{ color: cat.color }}>
                  {cat.budget ? `${cat.currency === 'USD' ? '$' : 'S/'} ${cat.budget.toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
            {/* Modal header */}
            <div className="px-6 pt-6 pb-5 border-b flex justify-between items-start relative" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {editingCategory ? t('edit') : t('add')}
                  </h3>
                  {name && <p className="text-sm font-medium mt-0.5 text-emerald-600">{name}</p>}
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors shadow-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5" style={{ backgroundColor: 'transparent' }}>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Alimentación"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('color')}</label>
                {/* Preset swatches */}
                <div className="grid grid-cols-8 gap-2 mb-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                {/* Custom color row */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-10 h-10 rounded-xl shadow-sm border-2 border-white ring-1 ring-gray-200 cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <div className="text-xs text-gray-400">Personalizado</div>
                </div>
                {errors.color && <p className="text-xs text-red-500 mt-1">{errors.color}</p>}
              </div>

              {/* Budget + currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('budget')} <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="500"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{common('currency')}</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'PEN' | 'USD')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="PEN">{common('pen')}</option>
                    <option value="USD">{common('usd')}</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {common('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:bg-emerald-700 active:scale-[0.98]"
                >
                  {common('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
