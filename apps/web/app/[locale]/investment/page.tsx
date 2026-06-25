'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Scale, Target, PiggyBank, Trophy, Trash2, Plus } from 'lucide-react';

interface Bank { id: string; name: string; treaPEN: number | null; apyUSD: number | null; terms: number[]; }
interface Investment { id: string; amount: number; currency: string; termDays: number; treaApplied: number; projectedGain: number; finalAmount: number; endDate: string; bank: { name: string }; }
interface CompareRow { bankId: string; bankName: string; rate: number; gain: number; finalAmount: number; }
type Tab = 'calc' | 'compare' | 'goal';

export default function InvestmentPage() {
  const t = useTranslations('investment');
  const tc = useTranslations('common');
  const locale = useLocale();
  const fmt = (n: number, c = 'PEN') => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-PE', { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(n);

  const [tab, setTab] = useState<Tab>('calc');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    api.get<Bank[]>('/banks').then((b) => setBanks(b.filter((x) => x.treaPEN || x.apyUSD))).catch(() => {});
    api.get<Investment[]>('/investment').then(setInvestments).catch(() => {});
  }, []);

  // ── Calculadora ──────────────────────────────────────────────────────
  const [cBank, setCBank] = useState('');
  const [cAmount, setCAmount] = useState(5000);
  const [cTerm, setCTerm] = useState(180);
  const [cCurrency, setCCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [calc, setCalc] = useState<{ gain: number; finalAmount: number; rate: number } | null>(null);
  const selectedBank = banks.find((b) => b.id === cBank);

  async function runCalc() {
    if (!selectedBank) return;
    const rate = cCurrency === 'USD' ? selectedBank.apyUSD : selectedBank.treaPEN;
    if (!rate) return;
    const res = await api.post<{ gain: number; finalAmount: number }>('/investment/simulate', { capital: cAmount, trea: rate, termDays: cTerm });
    setCalc({ ...res, rate });
  }
  async function saveInvestment() {
    if (!selectedBank) return;
    const start = new Date();
    const end = new Date(); end.setDate(end.getDate() + cTerm);
    await api.post('/investment', { bankId: selectedBank.id, amount: cAmount, currency: cCurrency, termDays: cTerm, startDate: start.toISOString(), endDate: end.toISOString() });
    setInvestments(await api.get<Investment[]>('/investment'));
  }

  // ── Comparador ───────────────────────────────────────────────────────
  const [cmpAmount, setCmpAmount] = useState(5000);
  const [cmpTerm, setCmpTerm] = useState(180);
  const [cmpCurrency, setCmpCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [cmp, setCmp] = useState<{ results: CompareRow[]; bestBank: CompareRow | null } | null>(null);
  async function runCompare() {
    const res = await api.post<{ results: CompareRow[]; bestBank: CompareRow | null }>('/investment/compare', { amount: cmpAmount, currency: cmpCurrency, termDays: cmpTerm });
    setCmp(res);
  }

  // ── Simulador de meta ────────────────────────────────────────────────
  const [gTarget, setGTarget] = useState(10000);
  const [gInitial, setGInitial] = useState(2000);
  const [gMonthly, setGMonthly] = useState(500);
  const [gMonths, setGMonths] = useState(12);
  const [gBank, setGBank] = useState('');
  const [proj, setProj] = useState<{ projectedFinal: number; isReachable: boolean; monthsToGoal: number | null; suggestedMonthlyContribution: number | null; monthlyData: { month: number; amount: number }[] } | null>(null);
  async function runProjection() {
    const bank = banks.find((b) => b.id === gBank);
    const annualRate = bank?.treaPEN ?? 4;
    const res = await api.post<typeof proj>('/investment/goal-projection', { targetAmount: gTarget, initialCapital: gInitial, monthlyContribution: gMonthly, termMonths: gMonths, annualRate });
    setProj(res);
  }

  async function removeInvestment(id: string) {
    setInvestments((p) => p.filter((i) => i.id !== id));
    try { await api.delete(`/investment/${id}`); } catch {}
  }

  const tabs: { key: Tab; label: string; icon: typeof Calculator }[] = [
    { key: 'calc', label: t('calculator'), icon: Calculator },
    { key: 'compare', label: t('comparator'), icon: Scale },
    { key: 'goal', label: t('goalSimulator'), icon: Target },
  ];
  const inputCls = 'w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1';

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-6">Plazo fijo en bancos peruanos</p>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15} /> {tb.label}
            </button>
          );
        })}
      </div>

      {banks.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">{t('selectBank')} — primero configura bancos con tasas.</div>
      )}

      {/* CALCULADORA */}
      {tab === 'calc' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Banco</label>
              <select value={cBank} onChange={(e) => setCBank(e.target.value)} className={inputCls}>
                <option value="">{t('selectBank')}</option>
                {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tc('currency')}</label>
              <select value={cCurrency} onChange={(e) => setCCurrency(e.target.value as 'PEN' | 'USD')} className={inputCls}>
                <option value="PEN">PEN (S/)</option><option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('amount')}</label>
              <input type="number" value={cAmount} onChange={(e) => setCAmount(+e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('termDays')}</label>
              <select value={cTerm} onChange={(e) => setCTerm(+e.target.value)} className={inputCls}>
                {(selectedBank?.terms ?? [30, 60, 90, 180, 270, 360]).map((d) => <option key={d} value={d}>{d} días</option>)}
              </select>
            </div>
          </div>
          <button onClick={runCalc} disabled={!cBank} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm">{t('calculate')}</button>

          {calc && (
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{t('gain')}</p>
                <p className="text-xl font-bold text-emerald-600">{fmt(calc.gain, cCurrency)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{t('finalAmount')}</p>
                <p className="text-xl font-bold text-gray-900">{fmt(calc.finalAmount, cCurrency)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{t('effectiveRate')}</p>
                <p className="text-xl font-bold text-gray-900">{calc.rate}%</p>
              </div>
              <div className="col-span-3">
                <button onClick={saveInvestment} className="flex items-center gap-2 text-sm text-emerald-700 font-medium hover:underline">
                  <Plus size={14} /> {t('saveInvestment')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPARADOR */}
      {tab === 'compare' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div><label className={labelCls}>{t('amount')}</label><input type="number" value={cmpAmount} onChange={(e) => setCmpAmount(+e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>{tc('currency')}</label>
              <select value={cmpCurrency} onChange={(e) => setCmpCurrency(e.target.value as 'PEN' | 'USD')} className={inputCls}><option value="PEN">PEN (S/)</option><option value="USD">USD ($)</option></select>
            </div>
            <div><label className={labelCls}>{t('termDays')}</label>
              <select value={cmpTerm} onChange={(e) => setCmpTerm(+e.target.value)} className={inputCls}>{[30, 60, 90, 180, 270, 360].map((d) => <option key={d} value={d}>{d} días</option>)}</select>
            </div>
          </div>
          <button onClick={runCompare} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-2 text-sm">{t('compare')}</button>

          {cmp && (cmp.results.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">{t('noBanksForTerm')}</p>
          ) : (
            <div className="mt-5 space-y-2">
              {cmp.results.map((r, i) => (
                <div key={r.bankId} className={`flex items-center justify-between rounded-xl border p-3 ${i === 0 ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    {i === 0 && <Trophy size={15} className="text-amber-500" />}
                    <span className="font-medium text-gray-800">{r.bankName}</span>
                    <span className="text-xs text-gray-400">{r.rate}%</span>
                    {i === 0 && <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{t('bestBankLabel')}</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">+{fmt(r.gain, cmpCurrency)}</p>
                    <p className="text-xs text-gray-400">{fmt(r.finalAmount, cmpCurrency)}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* SIMULADOR DE META */}
      {tab === 'goal' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div><label className={labelCls}>{t('title')} objetivo</label><input type="number" value={gTarget} onChange={(e) => setGTarget(+e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>{t('initialCapital')}</label><input type="number" value={gInitial} onChange={(e) => setGInitial(+e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>{t('monthlyContribution')}</label><input type="number" value={gMonthly} onChange={(e) => setGMonthly(+e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>{t('months')}</label><input type="number" value={gMonths} onChange={(e) => setGMonths(+e.target.value)} className={inputCls} /></div>
            <div className="col-span-2 md:col-span-2"><label className={labelCls}>Banco</label>
              <select value={gBank} onChange={(e) => setGBank(e.target.value)} className={inputCls}><option value="">{t('selectBank')}</option>{banks.filter((b) => b.treaPEN).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.treaPEN}%)</option>)}</select>
            </div>
          </div>
          <button onClick={runProjection} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-2 text-sm">{t('calculate')}</button>

          {proj && (
            <div className="mt-5">
              <div className={`rounded-xl p-4 mb-4 ${proj.isReachable ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                {proj.isReachable ? (
                  <p className="text-sm font-semibold text-emerald-700">✓ {t('reachable')} {proj.monthsToGoal ? `(${proj.monthsToGoal} ${t('months')})` : ''} — {t('finalAmount')}: {fmt(proj.projectedFinal)}</p>
                ) : (
                  <p className="text-sm font-semibold text-amber-700">{t('notReachable')}. {t('suggestedContribution')}: {fmt(proj.suggestedMonthlyContribution ?? 0)}/mes</p>
                )}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={proj.monthlyData}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={50} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-soft)', color: 'var(--text-main)', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: 'var(--text-main)' }} formatter={(v: number) => fmt(v)} labelFormatter={(l) => `${t('month')} ${l}`} />
                    <Area type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INVERSIONES ACTIVAS */}
      <div className="mt-6">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><PiggyBank size={17} className="text-emerald-600" />{t('activeInvestments')}</h2>
        {investments.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noActive')}</p>
        ) : (
          <div className="space-y-2">
            {investments.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-800">{inv.bank?.name} · {fmt(inv.amount, inv.currency)} a {inv.termDays} días</p>
                  <p className="text-xs text-gray-400">{t('gain')}: +{fmt(inv.projectedGain, inv.currency)} ({inv.treaApplied}%) · vence {new Date(inv.endDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <button onClick={() => removeInvestment(inv.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
