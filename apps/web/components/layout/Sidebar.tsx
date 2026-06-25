'use client';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  LayoutDashboard, TrendingUp, TrendingDown, BarChart3,
  Building2, PiggyBank, Target, Bot, Wallet, Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/income', icon: TrendingUp, labelKey: 'income' },
  { href: '/expenses', icon: TrendingDown, labelKey: 'expenses' },
  { href: '/categories', icon: Target, labelKey: 'categories' },
  { href: '/reports', icon: BarChart3, labelKey: 'reports' },
  { href: '/banks', icon: Building2, labelKey: 'banks' },
  { href: '/investment', icon: PiggyBank, labelKey: 'investment' },
  { href: '/goals', icon: Target, labelKey: 'goals' },
  { href: '/chat', icon: Bot, labelKey: 'chat' },
];

export default function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    if (pathname === href) return;
    setNavigatingTo(href);
    router.push(href);
  };

  return (
    <>
      {navigatingTo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-gray-700 font-medium">Cargando...</p>
          </div>
        </div>
      )}
      <aside className="w-60 flex flex-col shrink-0"
        style={{ background: 'linear-gradient(180deg, #0a3d2e 0%, #062a1f 100%)' }}>
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
            <Wallet size={17} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-wide">FinSmart</span>
            <p className="text-emerald-400 text-[10px] font-medium leading-none mt-0.5">finanzas · ia</p>
          </div>
        </div>

        <div className="mx-4 h-px bg-emerald-800/50 mb-2" />

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                onMouseEnter={() => router.prefetch(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive ? 'text-white' : 'text-emerald-200/75 hover:text-emerald-50 hover:bg-emerald-800/40'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(90deg, rgba(52,211,153,0.22) 0%, rgba(52,211,153,0.07) 100%)',
                  boxShadow: 'inset 3px 0 0 #34d399',
                } : undefined}
              >
                {navigatingTo === item.href ? (
                  <Loader2 size={17} className="animate-spin text-emerald-300" />
                ) : (
                  <Icon size={17} className={isActive ? 'text-emerald-300' : ''} />
                )}
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>

        <div className="mx-4 h-px bg-emerald-800/50" />
        <div className="px-5 py-3">
          <p className="text-[10px] text-emerald-500/70">FinSmart v1.0</p>
        </div>
      </aside>
    </>
  );
}
