'use client';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  PiggyBank,
  Target,
  Bot,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/income', icon: TrendingUp, labelKey: 'income' },
  { href: '/expenses', icon: TrendingDown, labelKey: 'expenses' },
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-indigo-600">FinSmart</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">FinSmart v0.1.0</p>
      </div>
    </aside>
  );
}
