import { Outlet } from 'react-router-dom';

import { SideRail } from './SideRail';
import { TodayRail } from './TodayRail';

export function GuideShell() {
  return (
    <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 py-8 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
      <SideRail />
      <main className="min-w-0">
        <Outlet />
      </main>
      <TodayRail />
    </div>
  );
}
