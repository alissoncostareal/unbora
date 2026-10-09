'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSidebar } from '@/lib/sidebarContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Visão Geral & Métricas', href: '/', icon: '📊' },
  { label: 'Meus Estabelecimentos', href: '/places', icon: '📍' },
  { label: 'Planos & Recarga CPC', href: '/plans', icon: '💎' },
  { label: 'Faturas & PIX', href: '/invoices', icon: '💳' },
  { label: 'Validador de Perks', href: '/perks', icon: '🎁' },
  { label: 'Dados da Empresa', href: '/settings', icon: '🏢' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f1115] text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7c2f1d] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                U
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg text-white tracking-tight">Unbora</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#7c2f1d]/40 text-amber-300 border border-amber-400/30">
                    Business
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[120px]">
                  {user?.businessName || 'Portal do Parceiro'}
                </p>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={closeMobile}
              aria-label="Fechar Menu"
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Menu Principal
            </span>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#7c2f1d] text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-slate-700 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Parceiro'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              closeMobile();
              logout();
            }}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-slate-800 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <span>🚪</span> Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
