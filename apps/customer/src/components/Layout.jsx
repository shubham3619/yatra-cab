import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, Logo, Avatar, IconButton } from '@yatracab/ui';
import { Car, Home, ScrollText, User, LogOut, Compass, Gift } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true, mobile: true },
  { to: '/book', label: 'Book', icon: Car, mobile: false },
  { to: '/discover', label: 'Discover', icon: Compass, mobile: true },
  { to: '/rides', label: 'My Rides', icon: ScrollText, mobile: true },
  { to: '/rewards', label: 'Rewards', icon: Gift, mobile: true },
  { to: '/profile', label: 'Profile', icon: User, mobile: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo mark={Car} name="YatraCab" tagline="Rides, your way" />
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink-800">{user?.name || 'Rider'}</p>
              <p className="text-xs text-ink-400">{user?.phone}</p>
            </div>
            <Avatar name={user?.name || 'You'} size={38} />
            <IconButton icon={LogOut} label="Log out" onClick={onLogout} />
          </div>
        </div>
      </header>

      {/* Desktop tabs */}
      <nav className="mx-auto hidden max-w-3xl gap-1 px-4 pt-4 sm:flex">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-accent text-accent-fg' : 'text-ink-500 hover:bg-ink-200/60'
              }`
            }
          >
            <n.icon size={16} /> {n.label}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:pb-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {NAV.filter((n) => n.mobile).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-ink-400'
                }`
              }
            >
              <n.icon size={20} /> {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
