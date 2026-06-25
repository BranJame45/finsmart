'use client';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Target, Plus, Pencil, Trash2, X, CheckCircle2, PiggyBank, CalendarClock, Landmark } from 'lucide-react';

type Bank = { id: string; name: string };

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: 'PEN' | 'USD';
  deadline: string | null;
  bankId: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  bank?: { id: string; name: string } | null;
  remaining: number;
  progress: number;
  monthsLeft: number | null;
  monthlySavingNeeded: number | null;
};

type GoalForm = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: 'PEN' | 'USD';
  deadline: string;
  bankId: string;
};

const emptyForm: GoalForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  currency: 'PEN',
  deadline: '',
  bankId: '',
};

export default function GoalsPage() {
  const t = useTranslations('goals');
  const common = useTranslations('common');
  const locale = useLocale();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal de creación / edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm);

  // Modal de actualizar ahorro
  const [savingGoal, setSavingGoal] = useState<Goal | null>(null);
  const [savingValue, setSavingValue] = useState('');

  const fmt = (value: number, currency: string) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-PE', {
      style: 'currency',
      currency: currency || 'PEN',
      maximumFractionDigits: 0,
    }).format(value);

  const fetchData = async () => {
    try {
      const [goalsData, banksData] = await Promise.all([
        api.get<Goal[]>('/goals'),
        api.get<Bank[]>('/banks'),
      ]);
      setGoals(goalsData);
      setBanks(banksData);
    } catch (e) {
      console.error('Error cargando metas', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingGoal(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      currency: goal.currency || 'PEN',
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      bankId: goal.bankId || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(form.targetAmount);
    if (!form.name.trim() || isNaN(target) || target <= 0) return;

    const current = parseFloat(form.currentAmount);
    const payload = {
      name: form.name.trim(),
      targetAmount: target,
      currentAmount: isNaN(current) ? 0 : current,
      currency: form.currency,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      bankId: form.bankId || undefined,
    };

    setSaving(true);
    try {
      if (editingGoal) {
        await api.patch(`/goals/${editingGoal.id}`, payload);
      } else {
        await api.post('/goals', payload);
      }
      await fetchData();
      closeModal();
    } catch (err) {
      console.error('Error guardando meta', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/goals/${id}`);
      await fetchData();
    } catch (err) {
      console.error('Error eliminando meta', err);
    }
  };

  const handleComplete = async (goal: Goal) => {
    try {
      await api.patch(`/goals/${goal.id}`, { status: 'COMPLETED' });
      await fetchData();
    } catch (err) {
      console.error('Error completando meta', err);
    }
  };

  const openSaving = (goal: Goal) => {
    setSavingGoal(goal);
    setSavingValue(String(goal.currentAmount));
  };

  const handleSaveAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingGoal) return;
    const value = parseFloat(savingValue);
    if (isNaN(value) || value < 0) return;
    setSaving(true);
    try {
      await api.patch(`/goals/${savingGoal.id}`, { currentAmount: value });
      await fetchData();
      setSavingGoal(null);
    } catch (err) {
      console.error('Error actualizando ahorro', err);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: Goal['status']) => {
    const map: Record<Goal['status'], { label: string; classes: string }> = {
      ACTIVE: { label: t('active'), classes: 'bg-emerald-50 text-emerald-700' },
      COMPLETED: { label: t('completed'), classes: 'bg-blue-50 text-blue-700' },
      CANCELLED: { label: t('cancelled'), classes: 'bg-gray-100 text-gray-500' },
    };
    const s = map[status];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.classes}`}>
        {s.label}
      </span>
    );
  };

  const inputClass =
    'border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none w-full';
  const primaryBtn =
    'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-2 text-sm';

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Target size={20} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        </div>
        <button onClick={openCreate} className={`${primaryBtn} flex items-center gap-2`}>
          <Plus size={16} />
          {t('add')}
        </button>
      </div>

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse"
            >
              <div className="h-5 w-1/2 bg-gray-200 rounded mb-4" />
              <div className="h-3 w-full bg-gray-200 rounded mb-3" />
              <div className="h-2.5 w-full bg-gray-100 rounded-full mb-4" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        /* Estado vacío */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={26} />
          </div>
          <p className="text-gray-500 mb-5">{t('empty')}</p>
          <button onClick={openCreate} className={`${primaryBtn} inline-flex items-center gap-2`}>
            <Plus size={16} />
            {t('add')}
          </button>
        </div>
      ) : (
        /* Listado */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g) => {
            const progress = Math.min(100, Math.max(0, Math.round(g.progress)));
            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{g.name}</h2>
                    <div className="mt-1">{statusBadge(g.status)}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(g)}
                      title={common('edit')}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      title={common('delete')}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progreso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">{t('progress')}</span>
                    <span className="font-semibold text-gray-900">{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="font-semibold text-gray-900">
                      {fmt(g.currentAmount, g.currency)}
                    </span>
                    <span className="text-gray-400">{fmt(g.targetAmount, g.currency)}</span>
                  </div>
                </div>

                {/* Detalles */}
                <div className="space-y-2 text-sm border-t border-gray-100 pt-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{t('remaining')}</span>
                    <span className="font-medium text-gray-700">
                      {fmt(g.remaining, g.currency)}
                    </span>
                  </div>

                  {g.deadline && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <CalendarClock size={14} />
                          {t('monthsLeft')}
                        </span>
                        <span className="font-medium text-gray-700">
                          {g.monthsLeft ?? 0}
                        </span>
                      </div>
                      {g.monthlySavingNeeded != null && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <PiggyBank size={14} />
                            {t('monthlyNeeded')}
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {fmt(g.monthlySavingNeeded, g.currency)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Landmark size={14} />
                      {t('linkedBank')}
                    </span>
                    <span className="font-medium text-gray-700">
                      {g.bank?.name || t('noBank')}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                {g.status !== 'COMPLETED' && (
                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      onClick={() => openSaving(g)}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <PiggyBank size={15} />
                      {t('updateAmount')}
                    </button>
                    <button
                      onClick={() => handleComplete(g)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
                    >
                      <CheckCircle2 size={15} />
                      {t('completed')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear / editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editingGoal ? t('edit') : t('add')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form id="goal-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('targetAmount')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('currentAmount')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.currentAmount}
                    onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {common('currency')}
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value as 'PEN' | 'USD' })
                    }
                    className={inputClass}
                  >
                    <option value="PEN">{common('pen')}</option>
                    <option value="USD">{common('usd')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('deadlineOptional')}
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('linkedBank')}{' '}
                  <span className="text-gray-400 font-normal">({common('optional')})</span>
                </label>
                <select
                  value={form.bankId}
                  onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">{t('noBank')}</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                {common('cancel')}
              </button>
              <button type="submit" form="goal-form" disabled={saving} className={`${primaryBtn} flex-1 disabled:opacity-60`}>
                {saving ? t('saving') : common('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal actualizar ahorro */}
      {savingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setSavingGoal(null)}
          />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{t('updateAmount')}</h3>
              <button
                type="button"
                onClick={() => setSavingGoal(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAmount} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('currentAmount')} — {savingGoal.name}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={savingValue}
                  onChange={(e) => setSavingValue(e.target.value)}
                  className={inputClass}
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSavingGoal(null)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  {common('cancel')}
                </button>
                <button type="submit" disabled={saving} className={`${primaryBtn} flex-1 disabled:opacity-60`}>
                  {saving ? t('saving') : common('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
