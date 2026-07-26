import { useState, useEffect, useRef } from 'react';
import { Search, Home, Users, MessageCircle, Bell, Menu, Plus, LogOut, Bookmark, Moon, Sun, Compass } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { useTheme } from '@/context/ThemeContext';
import { unreadNotificationCount, fetchFriends, searchProfiles } from '@/lib/data';
import type { Profile } from '@/lib/types';
import { classNames } from '@/lib/utils';

export function TopBar() {
  const { profile, signOut } = useAuth();
  const { page, navigate } = useNav();
  const { theme, toggleTheme } = useTheme();
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const poll = () => {
      unreadNotificationCount().then((c) => { if (active) setUnread(c); });
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const r = await searchProfiles(query);
      setResults(r);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (!profile) return null;

  const navItems = [
    { name: 'home' as const, icon: Home, label: 'Home' },
    { name: 'explore' as const, icon: Compass, label: 'Explore' },
    { name: 'friends' as const, icon: Users, label: 'Friends' },
    { name: 'groups' as const, icon: Users, label: 'Groups' },
    { name: 'messages' as const, icon: MessageCircle, label: 'Messages' },
  ];

  const isActive = (name: string) => {
    if (page.name === name) return true;
    if (name === 'groups' && page.name === 'group') return true;
    if (name === 'profile' && page.name === 'profile') return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-3 h-14 max-w-[2000px] mx-auto">
        {/* left: logo + search */}
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => navigate({ name: 'home' })} className="shrink-0">
            <Logo size={40} />
          </button>
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="bg-gray-100 dark:bg-gray-800 rounded-full pl-9 pr-4 py-2 w-48 lg:w-64 text-sm outline-none focus:w-72 transition-all dark:text-white"
              placeholder="Search Atlas"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            {searchOpen && results.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 max-h-80 overflow-y-auto z-50">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { navigate({ name: 'profile', userId: p.id }); setQuery(''); setResults([]); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <Avatar profile={p} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{p.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* center: nav */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate({ name: item.name })}
              className={classNames(
                'px-6 lg:px-8 py-2 rounded-lg flex items-center justify-center transition-colors relative',
                isActive(item.name) ? 'text-[#1877F2] border-b-2 border-[#1877F2]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
              title={item.label}
            >
              <item.icon size={24} />
            </button>
          ))}
        </nav>

        {/* right: actions */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          <button
            onClick={() => navigate({ name: 'profile', userId: profile.id })}
            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full pl-1 pr-2 py-1"
            title={profile.full_name}
          >
            <Avatar profile={profile} size="sm" />
            <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">{profile.full_name.split(' ')[0]}</span>
          </button>

          <button
            onClick={() => navigate({ name: 'notifications' })}
            className={classNames('relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800', page.name === 'notifications' && 'bg-gray-100 dark:bg-gray-800')}
            title="Notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-semibold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((s) => !s)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Menu">
              <Menu size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 w-56 z-50" onMouseLeave={() => setMenuOpen(false)}>
                <MenuItem icon={Home} label="Home" onClick={() => { navigate({ name: 'home' }); setMenuOpen(false); }} />
                <MenuItem icon={Compass} label="Explore" onClick={() => { navigate({ name: 'explore' }); setMenuOpen(false); }} />
                <MenuItem icon={Users} label="Friends" onClick={() => { navigate({ name: 'friends' }); setMenuOpen(false); }} />
                <MenuItem icon={MessageCircle} label="Messages" onClick={() => { navigate({ name: 'messages' }); setMenuOpen(false); }} />
                <MenuItem icon={Bell} label="Notifications" onClick={() => { navigate({ name: 'notifications' }); setMenuOpen(false); }} />
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <MenuItem icon={Bookmark} label="Saved posts" onClick={() => { navigate({ name: 'saved' }); setMenuOpen(false); }} />
                <MenuItem icon={Users} label="My profile" onClick={() => { navigate({ name: 'profile', userId: profile.id }); setMenuOpen(false); }} />
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <MenuItem icon={LogOut} label="Log out" onClick={() => { signOut(); setMenuOpen(false); }} danger />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-gray-100 dark:border-gray-800">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate({ name: item.name })}
            className={classNames('py-2 px-4 flex items-center justify-center', isActive(item.name) ? 'text-[#1877F2] border-t-2 border-[#1877F2]' : 'text-gray-600 dark:text-gray-400')}
          >
            <item.icon size={22} />
          </button>
        ))}
        <button onClick={() => navigate({ name: 'notifications' })} className={classNames('py-2 px-4 relative', page.name === 'notifications' && 'text-[#1877F2]')}>
          <Bell size={22} />
          {unread > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center">{unread}</span>}
        </button>
      </nav>
    </header>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof Home; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={classNames('flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700', danger ? 'text-red-600' : 'text-gray-700 dark:text-gray-300')}>
      <Icon size={18} /> {label}
    </button>
  );
}

export { Plus, fetchFriends };
