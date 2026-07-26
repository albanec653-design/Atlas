import { useEffect, useState } from 'react';
import { Users, Calendar, Bookmark, Flag, Clock, ChevronRight, Gamepad2, ShoppingBag, Film, Briefcase } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { fetchFriends } from '@/lib/data';
import type { Profile } from '@/lib/types';
import { pluralize } from '@/lib/utils';

export function LeftSidebar() {
  const { profile } = useAuth();
  const { navigate } = useNav();
  const [friends, setFriends] = useState<Profile[]>([]);

  useEffect(() => {
    if (!profile) return;
    fetchFriends(profile.id).then(setFriends).catch(() => {});
  }, [profile]);

  if (!profile) return null;

  const items = [
    { icon: Users, label: 'Friends', action: () => navigate({ name: 'friends' }) },
    { icon: Users, label: 'Groups', action: () => navigate({ name: 'groups' }) },
    { icon: Bookmark, label: 'Saved', action: () => navigate({ name: 'saved' }) },
    { icon: Clock, label: 'Memories', action: () => navigate({ name: 'home' }) },
    { icon: Calendar, label: 'Events', action: () => navigate({ name: 'home' }) },
  ];

  return (
    <aside className="hidden lg:block w-64 xl:w-80 shrink-0 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin py-4 pr-2">
      <button
        onClick={() => navigate({ name: 'profile', userId: profile.id })}
        className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-200/70 text-left"
      >
        <Avatar profile={profile} size="md" />
        <span className="font-semibold text-gray-800 truncate">{profile.full_name}</span>
      </button>

      <nav className="mt-2 space-y-0.5">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={it.action}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-200/70 text-left"
          >
            <span className="w-9 h-9 rounded-full bg-gray-200 text-primary flex items-center justify-center">
              <it.icon size={20} />
            </span>
            <span className="font-medium text-gray-800">{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-200 my-3" />

      <p className="px-2 text-sm font-semibold text-gray-500 mb-1">Shortcuts</p>
      <nav className="space-y-0.5">
        {[
          { icon: Gamepad2, label: 'Gaming' },
          { icon: Film, label: 'Videos' },
          { icon: ShoppingBag, label: 'Marketplace' },
          { icon: Briefcase, label: 'Jobs' },
          { icon: Flag, label: 'Pages' },
        ].map((it) => (
          <button key={it.label} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-200/70 text-left">
            <span className="w-9 h-9 rounded-full bg-gray-200 text-amber-600 flex items-center justify-center">
              <it.icon size={20} />
            </span>
            <span className="font-medium text-gray-800">{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-200 my-3" />

      <p className="px-2 text-sm font-semibold text-gray-500 mb-1">{pluralize(friends.length, 'Friend')}</p>
      <div className="space-y-0.5">
        {friends.slice(0, 10).map((f) => (
          <button
            key={f.id}
            onClick={() => navigate({ name: 'profile', userId: f.id })}
            className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-gray-200/70 text-left"
          >
            <Avatar profile={f} size="sm" />
            <span className="text-sm font-medium text-gray-800 truncate">{f.full_name}</span>
          </button>
        ))}
        {friends.length > 10 && (
          <button className="flex items-center gap-1 w-full px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-200/70 rounded-lg">
            See all <ChevronRight size={14} />
          </button>
        )}
      </div>

      <p className="px-2 mt-6 text-xs text-gray-400">Atlas · Privacy · Terms · Cookies · © 2026</p>
    </aside>
  );
}

export function RightSidebar() {
  const { profile } = useAuth();
  const { navigate } = useNav();
  const [friends, setFriends] = useState<Profile[]>([]);

  useEffect(() => {
    if (!profile) return;
    fetchFriends(profile.id).then(setFriends).catch(() => {});
  }, [profile]);

  const online = friends.slice(0, 8);

  return (
    <aside className="hidden xl:block w-72 shrink-0 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin py-4 pl-2">
      <p className="px-2 text-sm font-semibold text-gray-500 mb-2">Contacts</p>
      <div className="space-y-0.5">
        {online.length === 0 && (
          <p className="px-2 text-sm text-gray-400">No contacts yet. Add friends to see them here.</p>
        )}
        {online.map((f) => (
          <button
            key={f.id}
            onClick={() => navigate({ name: 'messages' })}
            className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-gray-200/70 text-left"
          >
            <div className="relative">
              <Avatar profile={f} size="sm" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <span className="text-sm font-medium text-gray-800 truncate">{f.full_name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
