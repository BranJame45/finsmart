'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import IncomeVsExpenses from '@/components/charts/IncomeVsExpenses';
import ExpensesDonut from '@/components/charts/ExpensesDonut';
import MonthlySavings from '@/components/charts/MonthlySavings';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const [year, setYear] = useState(new Date().getFullYear());

  const sampleIncomeExpenses = [
    { month: 'Ene', income: 3000, expenses: 2000 },
    { month: 'Feb', income: 3200, expenses: 2100 },
    { month: 'Mar', income: 3100, expenses: 1900 },
    { month: 'Abr', income: 3300, expenses: 2200 },
    { month: 'May', income: 3400, expenses: 2000 },
    { month: 'Jun', income: 3500, expenses: 2300 },
  ];

  const sampleExpenses = [
    { name: 'Housing', value: 800 },
    { name: 'Food', value: 400 },
    { name: 'Transport', value: 200 },
    { name: 'Entertainment', value: 150 },
    { name: 'Other', value: 350 },
  ];

  const sampleSavings = [
    { month: 'Ene', savings: 1000 },
    { month: 'Feb', savings: 1100 },
    { month: 'Mar', savings: 1200 },
    { month: 'Abr', savings: 1100 },
    { month: 'May', savings: 1400 },
    { month: 'Jun', savings: 1200 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">{t('selectYear')}</label>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">{t('incomeVsExpenses')}</h2>
          <IncomeVsExpenses data={sampleIncomeExpenses} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">{t('categoryBreakdown')}</h2>
          <ExpensesDonut data={sampleExpenses} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">{t('monthlySavings')}</h2>
          <MonthlySavings data={sampleSavings} />
        </div>
      </div>
    </div>
  );
}
