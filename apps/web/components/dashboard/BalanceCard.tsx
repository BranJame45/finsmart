interface BalanceCardProps {
  title: string;
  amount: number;
}

export default function BalanceCard({ title, amount }: BalanceCardProps) {
  const formatted = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold">{formatted}</p>
    </div>
  );
}
