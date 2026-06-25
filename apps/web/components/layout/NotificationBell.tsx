'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Bell, AlertTriangle, TrendingDown, Target } from 'lucide-react';

interface Notif { id: string; type: string; message: string; read: boolean; createdAt: string }

const ICON: Record<string, typeof Bell> = {
  budget_exceeded: AlertTriangle,
  negative_balance: TrendingDown,
  goal_at_risk: Target,
};

export default function NotificationBell() {
  const t = useTranslations('notifications');
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function load() {
    try { setItems(await api.get<Notif[]>('/notifications')); } catch {}
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await api.patch(`/notifications/${id}/read`, {}); } catch {}
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5"
        style={{ color: 'var(--text-2)' }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-lg z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="px-4 py-3 border-b text-sm font-semibold" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-1)' }}>
            {t('title')}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>{t('empty')}</p>
            ) : (
              items.map((n) => {
                const Icon = ICON[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className="w-full text-left px-4 py-3 flex gap-3 border-b transition-colors hover:bg-black/5"
                    style={{ borderColor: 'var(--border-soft)', opacity: n.read ? 0.55 : 1 }}
                  >
                    <Icon size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{n.message}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
