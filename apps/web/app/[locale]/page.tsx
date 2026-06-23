'use client';
import { useTranslations } from 'next-intl';
import BalanceCard from '@/components/dashboard/BalanceCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import GoalProgress from '@/components/dashboard/GoalProgress';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <BalanceCard title={t('balance')} amount={0} />
        <BalanceCard title={t('income')} amount={0} />
        <BalanceCard title={t('expenses')} amount={0} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetProgress />
        <GoalProgress />
      </div>
      <div className="mt-6">
        <RecentTransactions />
      </div>
    </div>
  );
}
