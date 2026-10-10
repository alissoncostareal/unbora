'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSidebar } from '@/lib/sidebarContext';

interface NavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Visão Geral & Métricas',
    href: '/',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Meus Estabelecimentos',
    href: '/places',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'Planos & Recarga CPC',
    href: '/plans',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
      </svg>
    ),
  },
  {
    label: 'Faturas & PIX',
    href: '/invoices',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="0" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Validador de Perks',
    href: '/perks',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    label: 'Dados da Empresa',
    href: '/settings',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
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
              <div className="w-10 h-10 rounded-none bg-[#7c2f1d] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                U
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-light text-lg text-white tracking-tight">Unbora</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-none bg-[#7c2f1d]/40 text-amber-300 border border-amber-400/30">
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
              className="lg:hidden w-8 h-8 rounded-none bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs uppercase cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Menu Principal
            </span>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#7c2f1d] text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  <span className="shrink-0">{IconComp({ className: 'size-4' })}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-none bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-slate-700 shrink-0">
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
            className="w-full py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}
