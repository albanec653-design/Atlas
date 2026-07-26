import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, Globe2, Lock, Loader2, ArrowLeft } from 'lucide-react';
import type { Group, Profile, Post } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';
import { PostComposer } from '@/components/PostComposer';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { fetchGroups, fetchGroup, fetchGroupPosts, fetchGroupMembers, isGroupMember, createGroup, joinGroup, leaveGroup } from '@/lib/data';
import { pluralize, classNames, timeAgo } from '@/lib/utils';

export function GroupsPage() {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const g = await fetchGroups();
      setGroups(g);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto py-4 px-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <button onClick={() => setCreating(true)} className="atlas-btn-primary flex items-center gap-1.5">
          <Plus size={18} /> Create group
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="atlas-input pl-10" placeholder="Search groups" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="atlas-card p-10 text-center">
          <Users size={40} className="mx-auto text-gray-300" />
          <p className="text-gray-500 mt-2">No groups found. Create the first one!</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((g) => (
          <GroupCard key={g.id} group={g} onOpen={() => navigate({ name: 'group', groupId: g.id })} />
        ))}
      </div>

      {creating && <CreateGroupModal onClose={() => setCreating(false)} onCreated={(g) => { setCreating(false); navigate({ name: 'group', groupId: g.id }); }} />}
    </div>
  );
}

function GroupCard({ group, onOpen }: { group: Group; onOpen: () => void }) {
  const PrivacyIcon = group.privacy === 'public' ? Globe2 : Lock;
  return (
    <button onClick={onOpen} className="atlas-card overflow-hidden text-left hover:shadow-md transition-shadow">
      <div className="h-28 bg-gradient-to-br from-[#1877F2] to-[#42b72a] relative">
        {group.cover_url && <img src={group.cover_url} alt="" className="w-full h-full object-cover" />}
        <span className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
          <PrivacyIcon size={12} /> {group.privacy}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 truncate">{group.name}</h3>
        {group.description && <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{group.description}</p>}
        <p className="text-xs text-gray-400 mt-1">Created {timeAgo(group.created_at)}</p>
      </div>
    </button>
  );
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const g = await createGroup({ name: name.trim(), description: description.trim() || undefined, cover_url: coverUrl.trim() || undefined, privacy });
      if (g) onCreated(g);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Create group">
      <div className="p-5 space-y-4">
        <div className="h-32 rounded-lg bg-gradient-to-br from-[#1877F2] to-[#42b72a] flex items-center justify-center text-white/80 text-sm">
          {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : 'Cover photo preview'}
        </div>
        <input className="atlas-input" placeholder="Cover image URL (optional)" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        <input className="atlas-input" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="atlas-input" rows={3} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex gap-2">
          {(['public', 'private'] as const).map((p) => (
            <button key={p} onClick={() => setPrivacy(p)} className={classNames('flex-1 p-3 rounded-lg border-2 text-left', privacy === p ? 'border-[#1877F2] bg-[#e7f0fd]' : 'border-gray-200')}>
              <p className="font-semibold capitalize flex items-center gap-1.5">{p === 'public' ? <Globe2 size={16} /> : <Lock size={16} />} {p}</p>
              <p className="text-xs text-gray-500">{p === 'public' ? 'Anyone can find and join' : 'Only invited people'}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
        <button onClick={onClose} className="atlas-btn-secondary">Cancel</button>
        <button onClick={handleCreate} disabled={submitting || !name.trim()} className="atlas-btn-primary">{submitting ? 'Creating…' : 'Create'}</button>
      </div>
    </Modal>
  );
}

export function GroupDetailPage({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, p, m] = await Promise.all([
        fetchGroup(groupId),
        fetchGroupPosts(groupId),
        fetchGroupMembers(groupId),
      ]);
      setGroup(g);
      setPosts(p);
      setMembers(m);
      if (user) setIsMember(await isGroupMember(groupId, user.id));
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    await joinGroup(groupId);
    load();
  };
  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return;
    await leaveGroup(groupId);
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={28} /></div>;
  if (!group) return <div className="atlas-card p-10 text-center mx-auto max-w-lg mt-10">Group not found.</div>;

  const PrivacyIcon = group.privacy === 'public' ? Globe2 : Lock;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="atlas-card overflow-hidden">
        <div className="h-48 sm:h-64 bg-gradient-to-r from-[#1877F2] to-[#42b72a] relative">
          {group.cover_url && <img src={group.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><PrivacyIcon size={14} /> {group.privacy} group</span>
                <span>· {pluralize(members.length, 'member')}</span>
              </div>
              {group.description && <p className="text-gray-600 mt-2">{group.description}</p>}
            </div>
            <div>
              {isMember ? (
                <button onClick={handleLeave} className="atlas-btn-secondary">Leave group</button>
              ) : (
                <button onClick={handleJoin} className="atlas-btn-primary">Join group</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 space-y-4">
          {isMember && <PostComposer groupId={group.id} onCreated={(p) => setPosts((prev) => [p, ...prev])} placeholder="Post in " />}
          {posts.length === 0 ? (
            <div className="atlas-card p-10 text-center text-gray-500">No posts in this group yet.</div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />)
          )}
        </div>

        <div className="space-y-4">
          <div className="atlas-card p-4">
            <h2 className="font-bold text-lg mb-3">Members ({members.length})</h2>
            <div className="space-y-1">
              {members.slice(0, 12).map((m) => (
                <button key={m.id} onClick={() => navigate({ name: 'profile', userId: m.id })} className="flex items-center gap-2 w-full p-1.5 rounded-lg hover:bg-gray-100 text-left">
                  <Avatar profile={m} size="sm" />
                  <span className="text-sm font-medium truncate">{m.full_name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ArrowLeft };
