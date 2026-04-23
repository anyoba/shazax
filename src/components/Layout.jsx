import { Link, NavLink } from 'react-router-dom';

function navClasses({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-white text-ink shadow-soft'
      : 'text-ink/65 hover:bg-white/70 hover:text-ink'
  }`;
}

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-80" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/60 bg-white/55 px-5 py-3 shadow-soft backdrop-blur-xl">
          <Link to="/" className="text-sm font-extrabold uppercase tracking-[0.24em] text-cocoa">
            OnLock Study
          </Link>
          <nav className="flex items-center gap-2 rounded-full bg-[#f6efe7]/90 p-1">
            <NavLink to="/" className={navClasses}>
              Home
            </NavLink>
            <NavLink to="/admin" className={navClasses}>
              Admin
            </NavLink>
          </nav>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
