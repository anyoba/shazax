import { useState } from 'react';
import MobileDrawer from '../components/concours/common/MobileDrawer.jsx';
import ConcoursMobileHeader from '../components/concours/navigation/ConcoursMobileHeader.jsx';
import ConcoursSidebar from '../components/concours/navigation/ConcoursSidebar.jsx';
import ConcoursTopbar from '../components/concours/navigation/ConcoursTopbar.jsx';

export default function ConcoursLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8ff] text-slate-950">
      <ConcoursMobileHeader onOpen={() => setMobileOpen(true)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Shazax Concours">
        <ConcoursSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </MobileDrawer>

      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 border-r border-slate-200 bg-white p-4 transition-all duration-300 lg:block ${
            collapsed ? 'w-[5.5rem]' : 'w-72'
          }`}
        >
          <ConcoursSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <ConcoursTopbar />
          {children}
        </main>
      </div>
    </div>
  );
}
