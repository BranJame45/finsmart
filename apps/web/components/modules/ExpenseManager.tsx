'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';

type Category = {
  id: string;
  name: string;
  color: string;
};

type Expense = {
  id: string;
  amount: number;
  currency: 'PEN' | 'USD';
  description: string;
  categoryId: string;
  date: string;
  recurring: boolean;
  frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';
};

const expenseSchema = z.object({
  amount: z.number().positive("El monto debe ser positivo"),
  currency: z.enum(['PEN', 'USD']).optional(),
  description: z.string().min(2, "Descripción requerida"),
  categoryId: z.string().uuid("Seleccione una categoría"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  recurring: z.boolean().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']).optional(),
});

export default function ExpenseManager() {
  const t = useTranslations('expenses');
  const common = useTranslations('common');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [expenseData, catData] = await Promise.all([
        api.get<Expense[]>('/expenses'),
        api.get<Category[]>('/categories')
      ]);
      setExpenses(expenseData);
      setCategories(catData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setAmount(String(expense.amount));
      setCurrency(expense.currency || 'PEN');
      setDescription(expense.description || '');
      setCategoryId(expense.categoryId || '');
      setDate(new Date(expense.date).toISOString().split('T')[0]);
      setRecurring(expense.recurring || false);
      setFrequency(expense.frequency || 'MONTHLY');
    } else {
      setEditingExpense(null);
      setAmount('');
      setCurrency('PEN');
      setDescription('');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setRecurring(false);
      setFrequency('MONTHLY');
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const amountNum = parseFloat(amount);
    const dataObj = {
      amount: amountNum,
      currency,
      description,
      categoryId,
      date: new Date(date).toISOString(),
      recurring,
      frequency: recurring ? frequency : undefined,
    };

    const result = expenseSchema.safeParse(dataObj);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => (formattedErrors[i.path[0]] = i.message));
      setErrors(formattedErrors);
      return;
    }

    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, result.data);
      } else {
        await api.post('/expenses', result.data);
      }
      await fetchData();
      closeModal();
    } catch (e) {
      console.error("Error saving expense", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este gasto?")) {
      try {
        await api.delete(`/expenses/${id}`);
        await fetchData();
      } catch (e) {
        console.error("Error deleting expense");
      }
    }
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : '-';
  };
  const getCategoryColor = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.color : '#cbd5e1';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('title')}</h2>
          <p className="text-sm text-gray-500">Controla tus gastos diarios y fijos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">{common('loading')}</div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={24} />
          </div>
          <p className="text-gray-500">{t('empty')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('date')}</th>
                  <th className="px-6 py-4 font-medium">{t('description')}</th>
                  <th className="px-6 py-4 font-medium">{t('category')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('amount')}</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{exp.description}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(exp.categoryId) }}></div>
                        <span className="text-gray-600">{getCategoryName(exp.categoryId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                      {exp.currency === 'USD' ? '$' : 'S/'} {exp.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(exp)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">
                {editingExpense ? t('edit') : t('add')}
              </h3>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      placeholder="Ej. Compra de supermercado"
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      placeholder="Ej. 150"
                    />
                    {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{common('currency')}</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'PEN' | 'USD')}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    >
                      <option value="PEN">{common('pen')}</option>
                      <option value="USD">{common('usd')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">-- Seleccione --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="recurringExpense"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="recurringExpense" className="text-sm font-medium text-gray-700">
                      {common('recurring')}
                    </label>
                  </div>
                  
                  {recurring && (
                    <div className="pl-7">
                      <label className="block text-xs font-medium text-gray-500 mb-1">{common('frequency')}</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      >
                        <option value="DAILY">{common('daily')}</option>
                        <option value="WEEKLY">{common('weekly')}</option>
                        <option value="BIWEEKLY">{common('biweekly')}</option>
                        <option value="MONTHLY">{common('monthly')}</option>
                        <option value="YEARLY">{common('yearly')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {common('cancel')}
              </button>
              <button
                type="submit"
                form="expense-form"
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                {common('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
