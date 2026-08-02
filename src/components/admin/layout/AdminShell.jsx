import { BookOpen, LogOut, Menu, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function getActiveTabLabel(tabs, activeTab) {
  return tabs.find(([id]) => id === activeTab)?.[1] || 'Admin';
}

function NavButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? 'bg-white text-gray-950 shadow-[0_12px_35px_rgba(255,255,255,0.12)]'
          : 'text-white/55 hover:bg-white/8 hover:text-white'
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
          active ? 'bg-primary text-white' : 'bg-white/6 text-white/55 group-hover:bg-white/10 group-hover:text-white'
        }`}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function AdminNav({ tabs, activeTab, onChangeTab, canAccessInstitutions, onNavigate }) {
  return (
    <nav className="space-y-2">
      {tabs.map(([id, label, Icon]) => (
        <NavButton
          key={id}
          active={activeTab === id}
          icon={Icon}
          label={label}
          onClick={() => {
            onChangeTab(id);
            onNavigate?.();
          }}
        />
      ))}
      {canAccessInstitutions ? (
        <a
          href="/admin/concours"
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white/55 transition hover:bg-white/8 hover:text-white"
          onClick={onNavigate}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/6 text-white/55 transition group-hover:bg-white/10 group-hover:text-white">
            <BookOpen size={17} />
          </span>
          <span>Concours</span>
        </a>
      ) : null}
    </nav>
  );
}

export default function AdminShell({
  activeTab,
  canAccessInstitutions,
  children,
  loading,
  newEmailCount,
  onChangeTab,
  onRefresh,
  onSignOut,
  role,
  tabs,
  lastRefresh,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = getActiveTabLabel(tabs, activeTab);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#080a13] text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,#080a13_0%,#111827_48%,#0b1020_100%)]" />
      <div className="fixed inset-x-0 top-0 -z-10 h-64 bg-[linear-gradient(90deg,rgba(139,92,246,0.18),rgba(59,130,246,0.14),transparent)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

      <aside className="fixed left-0 top-0 hidden h-screen w-80 border-r border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl xl:block">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-black text-white shadow-[0_20px_45px_rgba(139,92,246,0.35)]">
              S
            </div>
            <div>
              <div className="font-heading text-xl font-black">Shazax Admin</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Control center</div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            <ShieldCheck size={16} />
            <span className="font-semibold capitalize">{role || 'role'}</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.85)]" />
          </div>
        </div>

        <AdminNav
          tabs={tabs}
          activeTab={activeTab}
          onChangeTab={onChangeTab}
          canAccessInstitutions={canAccessInstitutions}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[min(86vw,340px)] border-r border-white/10 bg-[#0d111d] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="font-heading text-xl font-black">Shazax Admin</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/60"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <AdminNav
              tabs={tabs}
              activeTab={activeTab}
              onChangeTab={onChangeTab}
              canAccessInstitutions={canAccessInstitutions}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="xl:pl-80">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a13]/78 px-4 py-4 backdrop-blur-2xl sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 xl:hidden"
                aria-label="Ouvrir le menu admin"
              >
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <Sparkles size={14} />
                  Back-office premium
                </div>
                <h1 className="mt-1 truncate font-heading text-2xl font-black text-white sm:text-3xl">{activeLabel}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {newEmailCount > 0 ? (
                <span className="hidden rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm font-bold text-emerald-200 sm:inline-flex">
                  {newEmailCount} new
                </span>
              ) : null}
              {lastRefresh ? (
                <span className="hidden text-xs text-white/35 lg:block">{lastRefresh.toLocaleTimeString()}</span>
              ) : null}
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-red-400/15 bg-red-400/10 px-3 text-sm font-semibold text-red-200 transition hover:bg-red-400/15 sm:px-4"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
