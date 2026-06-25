'use client';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { api, API_URL } from '@/lib/api';
import IncomeVsExpenses from '@/components/charts/IncomeVsExpenses';
import ExpensesDonut from '@/components/charts/ExpensesDonut';
import MonthlySavings from '@/components/charts/MonthlySavings';
import { Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Annual { year: number; totalIncome: number; totalExpenses: number; monthlyData: { month: number; income: number; expenses: number }[]; }
interface Monthly { year: number; month: number; totalIncome: number; totalExpenses: number; dailyData: { day: number; income: number; expenses: number }[]; }
interface Comparison { categoryBreakdown: { category: string; total: number }[]; }

export default function ReportsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();
  const intlLocale = locale === 'en' ? 'en-US' : 'es-PE';
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [mode, setMode] = useState<'annual' | 'monthly'>('annual');
  const [annual, setAnnual] = useState<Annual | null>(null);
  const [monthly, setMonthly] = useState<Monthly | null>(null);
  const [comp, setComp] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n);
  const monthName = (m: number) => new Date(2024, m - 1, 1).toLocaleDateString(intlLocale, { month: 'short' });

  useEffect(() => {
    setLoading(true);
    
    if (mode === 'annual') {
      Promise.all([
        api.get<Annual>(`/reports/annual?year=${year}`),
        api.get<Comparison>(`/reports/comparison?from=${year}-01-01&to=${year}-12-31`),
      ]).then(([a, c]) => { setAnnual(a); setComp(c); }).catch(() => {}).finally(() => setLoading(false));
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      const paddedMonth = String(month).padStart(2, '0');
      Promise.all([
        api.get<Monthly>(`/reports/monthly?year=${year}&month=${month}`),
        api.get<Comparison>(`/reports/comparison?from=${year}-${paddedMonth}-01&to=${year}-${paddedMonth}-${lastDay}`),
      ]).then(([m, c]) => { setMonthly(m); setComp(c); }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [year, month, mode]);

  async function exportPdf() {
    setExporting(true);
    try {
      const token = localStorage.getItem('finsmart_token');
      const paddedMonth = String(month).padStart(2, '0');
      const lastDay = new Date(year, month, 0).getDate();
      
      const from = mode === 'annual' ? `${year}-01-01` : `${year}-${paddedMonth}-01`;
      const to = mode === 'annual' ? `${year}-12-31` : `${year}-${paddedMonth}-${lastDay}`;
      
      const res = await fetch(`${API_URL}/reports/export-pdf?from=${from}&to=${to}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `finsmart-reporte-${year}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  }

  const incomeExpensesData = mode === 'annual' 
    ? (annual?.monthlyData ?? []).map((d) => ({ month: monthName(d.month), income: d.income, expenses: d.expenses }))
    : (monthly?.dailyData ?? []).map((d) => ({ month: String(d.day), income: d.income, expenses: d.expenses }));

  const savingsData = mode === 'annual'
    ? (annual?.monthlyData ?? []).map((d) => ({ month: monthName(d.month), savings: d.income - d.expenses }))
    : (monthly?.dailyData ?? []).map((d) => ({ month: String(d.day), savings: d.income - d.expenses }));

  const donutData = (comp?.categoryBreakdown ?? []).map((c) => ({ name: c.category, value: c.total }));

  const currentTotalIncome = mode === 'annual' ? (annual?.totalIncome ?? 0) : (monthly?.totalIncome ?? 0);
  const currentTotalExpenses = mode === 'annual' ? (annual?.totalExpenses ?? 0) : (monthly?.totalExpenses ?? 0);

  const stats = [
    { label: t('income'), value: currentTotalIncome, icon: TrendingUp, red: false },
    { label: t('expenses'), value: currentTotalExpenses, icon: TrendingDown, red: true },
    { label: t('balance'), value: currentTotalIncome - currentTotalExpenses, icon: Wallet, red: (currentTotalIncome - currentTotalExpenses) < 0 },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('annual')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${mode === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Anual
            </button>
            <button
              onClick={() => setMode('monthly')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${mode === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mensual
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'monthly' && (
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{monthName(i + 1)}</option>
              ))}
            </select>
          )}
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportPdf} disabled={exporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl px-4 py-2 text-sm">
            <Download size={15} /> {exporting ? '...' : t('exportPdf')}
          </button>
        </div>
      </div>

      {/* Resumen anual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{s.label}</span>
                <Icon size={16} className={s.red ? 'text-red-500' : 'text-emerald-600'} />
              </div>
              <p className={`text-xl font-bold ${s.red ? 'text-red-600' : 'text-gray-900'}`}>{fmt(s.value)}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 bg-white rounded-2xl border border-gray-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-base font-semibold mb-4">{t('incomeVsExpenses')}</h2>
            <IncomeVsExpenses data={incomeExpensesData} />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-base font-semibold mb-4">{t('categoryBreakdown')}</h2>
            {donutData.length ? <ExpensesDonut data={donutData} /> : <p className="text-sm text-gray-400 py-12 text-center">{t('balance') && 'Sin gastos en el período'}</p>}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
            <h2 className="text-base font-semibold mb-4">{t('monthlySavings')}</h2>
            <MonthlySavings data={savingsData} />
          </div>
        </div>
      )}
    </div>
  );
}
