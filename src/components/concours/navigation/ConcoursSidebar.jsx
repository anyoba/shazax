import { NavLink } from 'react-router-dom';
import {
  Award,
  BookOpen,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  Crown,
  GraduationCap,
  Heart,
  Home,
  KeyRound,
  LogOut,
  Medal,
  Settings,
  Target,
  User,
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import BrandLogo from '../../BrandLogo';

export const concoursNavItems = [
  { to: '/concours', label: 'Accueil', icon: Home },
  { to: '/concours/concours', label: 'Mes concours', icon: GraduationCap },
  { to: '/concours/training', label: 'Entrainement QCM', icon: Target },
  { to: '/concours/training?mode=exam', label: 'Examens blancs', icon: ClipboardList },
  { to: '/concours/training', label: 'Cours et astuces', icon: BookOpen, badge: 'Soon' },
  { to: '/concours/progress', label: 'Ma progression', icon: Award },
  { to: '/concours/ranking', label: 'Classement national', icon: Medal },
  { to: '/concours/favorites', label: 'Mes favoris', icon: Heart },
  { to: '/concours/mistakes', label: 'Carnet d erreurs', icon: Crown },
  { to: '/concours/profile', label: 'Mon profil', icon: User },
  { to: '/concours/activation', label: 'Codes d activation', icon: KeyRound },
  { to: '/concours/settings', label: 'Parametres', icon: Settings },
  { to: '/concours/settings', label: 'Aide et support', icon: CircleHelp, badge: 'Soon' },
];

export default function ConcoursSidebar({ collapsed, onToggle, onNavigate }) {
  const { signOut } = useClerk();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between gap-3">
        <NavLink to="/concours" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <BrandLogo className="h-11 w-11 rounded-2xl" alt="Shazax" />
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-lg font-black text-slate-950">Shazax Concours</div>
              <div className="text-xs font-bold text-slate-400">Premium QCM local</div>
            </div>
          ) : null}
        </NavLink>

        <button
          type="button"
          onClick={onToggle}
          className="hidden h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 lg:flex"
          aria-label="Reduire la navigation"
        >
          <ChevronLeft size={17} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {concoursNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={`${item.label}-${item.to}`}
              to={item.to}
              onClick={onNavigate}
              end={item.to === '/concours'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{item.badge}</span>
                  ) : null}
                </>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ redirectUrl: '/' })}
        className="mt-5 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={19} />
        {!collapsed ? <span>Deconnexion</span> : null}
      </button>
    </div>
  );
}
