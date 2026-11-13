import { NavLink } from 'react-router-dom';
import { Home, LibraryBig, Search } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/library', label: 'Library', icon: LibraryBig },
];

/** Bottom navigation shown in place of the sidebar on small screens. */
export function MobileNav() {
  return (
    <nav className="flex shrink-0 items-stretch justify-around border-t border-line bg-surface lg:hidden">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-fg' : 'text-faint'
            }`
          }
        >
          <Icon size={20} strokeWidth={2.2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
