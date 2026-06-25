'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface IncomeVsExpensesProps {
  data: { month: string; income: number; expenses: number }[];
}

export default function IncomeVsExpenses({ data }: IncomeVsExpensesProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-soft)', color: 'var(--text-main)', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: 'var(--text-main)' }} />
        <Legend />
        <Bar dataKey="income" fill="#10B981" name="Income" />
        <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );
}
