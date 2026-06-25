'use client';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTheme } from '@/lib/theme';
import { logout } from '@/lib/auth';
import NotificationBell from './NotificationBell';
import { Globe, Sun, Moon, LogOut } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <header
      className="h-14 border-b flex items-center justify-end px-6 shrink-0 gap-2 transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)',
        borderColor: 'var(--border-soft)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <NotificationBell />

      <button
        onClick={toggle}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5"
        style={{ color: 'var(--text-2)' }}
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-emerald-600" />}
      </button>

      <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border text-xs"
        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-soft)', color: 'var(--text-2)' }}>
        <Globe size={12} className="text-emerald-500" />
        <button onClick={() => router.replace(pathname, { locale: 'es' })} className="font-semibold px-1 rounded hover:text-emerald-600 transition-colors">ES</button>
        <span className="opacity-30">|</span>
        <button onClick={() => router.replace(pathname, { locale: 'en' })} className="font-semibold px-1 rounded hover:text-emerald-600 transition-colors">EN</button>
      </div>

      <button
        onClick={() => logout()}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-red-500/10"
        style={{ color: 'var(--text-2)' }}
        title="Cerrar sesión"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
