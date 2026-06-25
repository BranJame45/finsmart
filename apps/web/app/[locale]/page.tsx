'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { api } from '@/lib/api';
import { Wallet, TrendingUp, TrendingDown, Target, ArrowRight } from 'lucide-react';

interface Dashboard {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  budgetUsage: { category: string; color: string; budget: number; spent: number; percentage: number }[];
  activeGoal: { id: string; name: string; targetAmount: number; currentAmount: number; percentage: number } | null;
  recentTransactions: { id: string; amount: number; currency: string; description: string; date: string; category: { name: string; color: string } }[];
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number, c = 'PEN') =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-PE', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    api.get<Dashboard>('/reports/dashboard').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="h-8 w-40 rounded-lg bg-gray-100 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: t('balance'), value: data?.balance ?? 0, icon: Wallet, accent: (data?.balance ?? 0) >= 0 ? 'emerald' : 'red' },
    { label: t('income'), value: data?.totalIncome ?? 0, icon: TrendingUp, accent: 'emerald' },
    { label: t('expenses'), value: data?.totalExpenses ?? 0, icon: TrendingDown, accent: 'red' },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('thisMonth')}</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          const isRed = s.accent === 'red';
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{s.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRed ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <Icon size={17} className={isRed ? 'text-red-500' : 'text-emerald-600'} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>{fmt(s.value)}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget usage */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4">{t('budgetUsage')}</h2>
          {!data?.budgetUsage.some((b) => b.budget > 0) ? (
            <p className="text-sm text-gray-400">{t('noBudgets')}</p>
          ) : (
            <div className="space-y-3.5">
              {data.budgetUsage.filter((b) => b.budget > 0).map((b) => {
                const over = b.spent > b.budget;
                return (
                  <div key={b.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />{b.category}
                      </span>
                      <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                        {fmt(b.spent)} {t('of')} {fmt(b.budget)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(b.percentage, 100)}%`, backgroundColor: over ? '#ef4444' : b.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active goal */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4">{t('goalProgress')}</h2>
          {!data?.activeGoal ? (
            <p className="text-sm text-gray-400">{t('noGoal')}</p>
          ) : (
            <button onClick={() => router.push('/goals')} className="w-full text-left group">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-emerald-600" />
                <span className="font-semibold text-gray-800">{data.activeGoal.name}</span>
                <ArrowRight size={14} className="text-gray-300 ml-auto group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-2">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${data.activeGoal.percentage}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{fmt(data.activeGoal.currentAmount)} / {fmt(data.activeGoal.targetAmount)}</span>
                <span className="font-semibold text-emerald-600">{Math.round(data.activeGoal.percentage)}%</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{t('recentTransactions')}</h2>
          <button onClick={() => router.push('/expenses')} className="text-xs text-emerald-600 font-medium hover:underline">{t('viewAll')}</button>
        </div>
        {!data?.recentTransactions.length ? (
          <p className="text-sm text-gray-400">{t('noTransactions')}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.category?.color || '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">{tx.category?.name} · {new Date(tx.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-PE', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="text-sm font-semibold text-red-500 shrink-0">- {fmt(tx.amount, tx.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
