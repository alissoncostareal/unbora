'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7c2f1d] text-white flex items-center justify-center font-black text-xl mx-auto animate-pulse">
            U
          </div>
          <p className="text-xs text-slate-400 font-medium">Carregando Portal do Parceiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
