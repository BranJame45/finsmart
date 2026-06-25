'use client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlySavingsProps {
  data: { month: string; savings: number }[];
}

export default function MonthlySavings({ data }: MonthlySavingsProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-soft)', color: 'var(--text-main)', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: 'var(--text-main)' }} />
        <Area
          type="monotone"
          dataKey="savings"
          stroke="#6366F1"
          fill="#6366F1"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
