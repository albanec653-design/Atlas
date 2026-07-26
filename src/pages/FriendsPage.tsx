import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, Users, Inbox, Loader2, Check, X } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { fetchFriends, fetchFriendRequests, fetchSentRequests, sendFriendRequest, respondToFriendRequest, removeFriend, searchProfiles } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { classNames } from '@/lib/utils';

type Tab = 'home' | 'requests' | 'suggestions' | 'all';

export function FriendsPage() {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [tab, setTab] = useState<Tab>('home');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<{ request: any; profile: Profile }[]>([]);
  const [sentIds, setSentIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [f, r, s] = await Promise.all([
        fetchFriends(user.id),
        fetchFriendRequests(user.id),
        fetchSentRequests(user.id),
      ]);
      setFriends(f);
      setRequests(r);
      setSentIds(s);

      // suggestions = some profiles that aren't friends and no pending request
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20);
      if (!error && data) {
        const all = data as unknown as Profile[];
        const friendIds = new Set(f.map((x) => x.id));
        const sugg = all.filter((p) => !friendIds.has(p.id) && !s.includes(p.id));
        setSuggestions(sugg);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const r = await searchProfiles(search);
      setSearchResults(r.filter((p) => p.id !== user?.id));
    }, 250);
    return () => clearTimeout(t);
  }, [search, user]);

  const handleAccept = async (reqId: string) => {
    await respondToFriendRequest(reqId, true);
    load();
  };
  const handleDecline = async (reqId: string) => {
    await respondToFriendRequest(reqId, false);
    load();
  };
  const handleAdd = async (userId: string) => {
    await sendFriendRequest(userId);
    setSentIds((prev) => [...prev, userId]);
    setSuggestions((prev) => prev.filter((p) => p.id !== userId));
  };
  const handleRemove = async (friendId: string) => {
    if (!confirm('Remove this friend?')) return;
    await removeFriend(friendId);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>;

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Users },
    { id: 'requests', label: 'Requests', icon: UserPlus, badge: requests.length },
    { id: 'suggestions', label: 'Suggestions', icon: Search },
    { id: 'all', label: 'All friends', icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto py-4 px-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* tabs sidebar */}
        <div className="atlas-card p-2 h-fit lg:sticky lg:top-16">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={classNames(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left mb-0.5',
                tab === t.id ? 'bg-[#e7f0fd] text-primary' : 'hover:bg-gray-100 text-gray-700',
              )}
            >
              <t.icon size={20} />
              <span className="font-medium flex-1">{t.label}</span>
              {!!t.badge && t.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="lg:col-span-3 space-y-4">
          {/* search */}
          <div className="atlas-card p-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="atlas-input pl-10"
                placeholder="Search for people on Atlas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {search && searchResults.length > 0 && (
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {searchResults.map((p) => (
                  <PersonCard key={p.id} profile={p} onOpen={() => navigate({ name: 'profile', userId: p.id })} actionLabel={sentIds.includes(p.id) ? 'Sent' : 'Add'} onAction={() => handleAdd(p.id)} disabled={sentIds.includes(p.id)} />
                ))}
              </div>
            )}
            {search && searchResults.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">No people found for "{search}"</p>
            )}
          </div>

          {tab === 'home' && (
            <>
              {requests.length > 0 && (
                <Section title="Friend requests" count={requests.length}>
                  {requests.map(({ request, profile }) => (
                    <PersonCard
                      key={request.id}
                      profile={profile}
                      onOpen={() => navigate({ name: 'profile', userId: profile.id })}
                      actionLabel="Confirm"
                      onAction={() => handleAccept(request.id)}
                      secondaryLabel="Delete"
                      onSecondary={() => handleDecline(request.id)}
                    />
                  ))}
                </Section>
              )}
              <Section title="People you may know" count={suggestions.length}>
                {suggestions.length === 0 ? (
                  <p className="text-gray-400 text-sm py-6 text-center">No suggestions right now.</p>
                ) : (
                  suggestions.slice(0, 6).map((p) => (
                    <PersonCard key={p.id} profile={p} onOpen={() => navigate({ name: 'profile', userId: p.id })} actionLabel={sentIds.includes(p.id) ? 'Sent' : 'Add friend'} onAction={() => handleAdd(p.id)} disabled={sentIds.includes(p.id)} />
                  ))
                )}
              </Section>
            </>
          )}

          {tab === 'requests' && (
            <Section title="Friend requests" count={requests.length}>
              {requests.length === 0 ? (
                <div className="text-center py-10">
                  <Inbox size={40} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">No friend requests right now.</p>
                </div>
              ) : (
                requests.map(({ request, profile }) => (
                  <PersonCard
                    key={request.id}
                    profile={profile}
                    onOpen={() => navigate({ name: 'profile', userId: profile.id })}
                    actionLabel="Confirm"
                    onAction={() => handleAccept(request.id)}
                    secondaryLabel="Delete"
                    onSecondary={() => handleDecline(request.id)}
                  />
                ))
              )}
            </Section>
          )}

          {tab === 'suggestions' && (
            <Section title="People you may know" count={suggestions.length}>
              {suggestions.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">No suggestions right now.</p>
              ) : (
                suggestions.map((p) => (
                  <PersonCard key={p.id} profile={p} onOpen={() => navigate({ name: 'profile', userId: p.id })} actionLabel={sentIds.includes(p.id) ? 'Sent' : 'Add friend'} onAction={() => handleAdd(p.id)} disabled={sentIds.includes(p.id)} />
                ))
              )}
            </Section>
          )}

          {tab === 'all' && (
            <Section title="All friends" count={friends.length}>
              {friends.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={40} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">You haven't added any friends yet.</p>
                </div>
              ) : (
                friends.map((p) => (
                  <PersonCard key={p.id} profile={p} onOpen={() => navigate({ name: 'profile', userId: p.id })} actionLabel="Remove" onAction={() => handleRemove(p.id)} danger />
                ))
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="atlas-card p-4">
      <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
        {title}
        {count !== undefined && count > 0 && <span className="text-gray-400 text-sm font-normal">({count})</span>}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function PersonCard({
  profile,
  onOpen,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  disabled,
  danger,
}: {
  profile: Profile;
  onOpen: () => void;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={onOpen} className="w-full text-left">
        <Avatar profile={profile} size="xl" className="w-full aspect-square rounded-none" />
      </button>
      <div className="p-3">
        <button onClick={onOpen} className="font-semibold text-gray-900 hover:underline block truncate">{profile.full_name}</button>
        <p className="text-xs text-gray-500 mb-2">@{profile.username}</p>
        <div className="flex gap-2">
          <button onClick={onAction} disabled={disabled} className={classNames('flex-1 text-sm py-1.5 rounded-lg font-medium', danger ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600' : 'bg-primary hover:bg-[#0f5fc7] text-white', disabled && 'opacity-60')}>
            {actionLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button onClick={onSecondary} className="flex-1 text-sm py-1.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700">{secondaryLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export { Check, X };
