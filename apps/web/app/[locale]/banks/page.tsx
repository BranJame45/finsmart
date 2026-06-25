'use client';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Power,
  Building2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  treaPEN: number | null;
  apyUSD: number | null;
  terms: number[];
  minAmountPEN: number | null;
  minAmountUSD: number | null;
  active: boolean;
}

interface BankPayload {
  name: string;
  treaPEN?: number | null;
  apyUSD?: number | null;
  terms: number[];
  minAmountPEN?: number | null;
  minAmountUSD?: number | null;
  active?: boolean;
}

interface ScrapeResult {
  success: boolean;
  message: string;
}

const TERM_OPTIONS = [30, 60, 90, 180, 270, 360];

const SUGGESTED_BANKS = [
  'BCP',
  'Interbank',
  'BBVA',
  'Scotiabank',
  'Mibanco',
  'Caja Arequipa',
  'Caja Piura',
  'Caja Sullana',
];

interface FormState {
  name: string;
  treaPEN: string;
  apyUSD: string;
  terms: number[];
  minAmountPEN: string;
  minAmountUSD: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: '',
  treaPEN: '',
  apyUSD: '',
  terms: [],
  minAmountPEN: '',
  minAmountUSD: '',
  active: true,
};

export default function BanksPage() {
  const t = useTranslations('banks');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  const currency = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  });

  const formatPercent = (value: number | null) =>
    value === null ? t('noRate') : `${value}%`;

  async function loadBanks() {
    setLoading(true);
    try {
      const data = await api.get<Bank[]>('/banks');
      setBanks(data);
    } catch {
      setBanks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanks();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(bank: Bank) {
    setEditingId(bank.id);
    setForm({
      name: bank.name,
      treaPEN: bank.treaPEN === null ? '' : String(bank.treaPEN),
      apyUSD: bank.apyUSD === null ? '' : String(bank.apyUSD),
      terms: [...bank.terms],
      minAmountPEN: bank.minAmountPEN === null ? '' : String(bank.minAmountPEN),
      minAmountUSD: bank.minAmountUSD === null ? '' : String(bank.minAmountUSD),
      active: bank.active,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function toggleFormTerm(term: number) {
    setForm((prev) => ({
      ...prev,
      terms: prev.terms.includes(term)
        ? prev.terms.filter((value) => value !== term)
        : [...prev.terms, term].sort((a, b) => a - b),
    }));
  }

  function parseNumber(value: string): number | null {
    if (value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: BankPayload = {
      name: form.name.trim(),
      treaPEN: parseNumber(form.treaPEN),
      apyUSD: parseNumber(form.apyUSD),
      terms: form.terms,
      minAmountPEN: parseNumber(form.minAmountPEN),
      minAmountUSD: parseNumber(form.minAmountUSD),
      active: form.active,
    };
    try {
      if (editingId) {
        await api.patch<Bank>(`/banks/${editingId}`, payload);
      } else {
        await api.post<Bank>('/banks', payload);
      }
      closeForm();
      await loadBanks();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(bank: Bank) {
    try {
      await api.patch<Bank>(`/banks/${bank.id}`, { active: !bank.active });
      setBanks((prev) =>
        prev.map((item) =>
          item.id === bank.id ? { ...item, active: !item.active } : item,
        ),
      );
    } catch {
      /* sin cambios si falla */
    }
  }

  async function handleDelete(bank: Bank) {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/banks/${bank.id}`);
      setBanks((prev) => prev.filter((item) => item.id !== bank.id));
    } catch {
      /* sin cambios si falla */
    }
  }

  async function handleScrape() {
    setScraping(true);
    setScrapeMessage(null);
    try {
      const result = await api.post<ScrapeResult>('/banks/scrape-rates', {});
      setScrapeMessage(result.message);
      if (result.success) await loadBanks();
    } catch (error) {
      setScrapeMessage(error instanceof Error ? error.message : tc('error'));
    } finally {
      setScraping(false);
    }
  }

  function applySuggestedBank(name: string) {
    setEditingId(null);
    setForm({ ...emptyForm, name });
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('add')}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-6 text-sm">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="flex-1">
          <strong>Valores Simulados:</strong> Las tasas mostradas son valores referenciales para fines de demostración. Debe investigar y actualizar manualmente las tasas reales directamente con cada institución financiera.
        </p>
      </div>

      {/* Bancos sugeridos */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">{t('suggested')}</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_BANKS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applySuggestedBank(name)}
              className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-700 rounded-full px-3 py-1.5 text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Listado */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse"
            >
              <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-12 bg-gray-200 rounded-full" />
                <div className="h-6 w-12 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : banks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm text-center">
          <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{bank.name}</h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    bank.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {bank.active ? t('active') : t('inactive')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500">{t('treaPEN')}</p>
                  <p className="text-base font-semibold text-gray-900">
                    {formatPercent(bank.treaPEN)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('apyUSD')}</p>
                  <p className="text-base font-semibold text-gray-900">
                    {formatPercent(bank.apyUSD)}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1.5">{t('terms')}</p>
                {bank.terms.length === 0 ? (
                  <p className="text-sm text-gray-400">{t('noRate')}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {bank.terms.map((term) => (
                      <span
                        key={term}
                        className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs font-medium"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4 text-sm text-gray-700">
                <p className="text-xs text-gray-500 mb-1">{t('minAmount')}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    {t('min')} {tc('pen')}:{' '}
                    {bank.minAmountPEN === null
                      ? t('noRate')
                      : currency.format(bank.minAmountPEN)}
                  </span>
                  <span>
                    {t('min')} {tc('usd')}:{' '}
                    {bank.minAmountUSD === null
                      ? t('noRate')
                      : currency.format(bank.minAmountUSD)}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleToggleActive(bank)}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-700"
                >
                  <Power className="w-4 h-4" />
                  {bank.active ? t('inactive') : t('active')}
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(bank)}
                    className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-gray-50 rounded-lg"
                    aria-label={tc('edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(bank)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                    aria-label={tc('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? t('edit') : t('add')}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-700"
                aria-label={tc('cancel')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('treaPEN')}{' '}
                    <span className="text-gray-400 font-normal">
                      ({tc('optional')})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.treaPEN}
                    onChange={(event) =>
                      setForm({ ...form, treaPEN: event.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('apyUSD')}{' '}
                    <span className="text-gray-400 font-normal">
                      ({tc('optional')})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.apyUSD}
                    onChange={(event) =>
                      setForm({ ...form, apyUSD: event.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('terms')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TERM_OPTIONS.map((term) => {
                    const checked = form.terms.includes(term);
                    return (
                      <label
                        key={term}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-pointer ${
                          checked
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFormTerm(term)}
                          className="accent-emerald-600"
                        />
                        {term}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('minAmount')} {tc('pen')}{' '}
                    <span className="text-gray-400 font-normal">
                      ({tc('optional')})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.minAmountPEN}
                    onChange={(event) =>
                      setForm({ ...form, minAmountPEN: event.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('minAmount')} {tc('usd')}{' '}
                    <span className="text-gray-400 font-normal">
                      ({tc('optional')})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.minAmountUSD}
                    onChange={(event) =>
                      setForm({ ...form, minAmountUSD: event.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.checked })
                  }
                  className="accent-emerald-600 w-4 h-4"
                />
                {t('active')}
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl px-4 py-2 text-sm"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-2 text-sm disabled:opacity-60"
                >
                  {saving ? t('saving') : tc('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
