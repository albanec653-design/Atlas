import { useState, useEffect, useCallback } from 'react';
import { Camera, Pencil, MapPin, Briefcase, GraduationCap, Calendar, Link2, Phone, MessageCircle, UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react';
import type { Profile, Post, Friendship } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { PostComposer } from '@/components/PostComposer';
import { PostCard } from '@/components/PostCard';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import {
  fetchProfile, fetchProfilePosts, updateProfile, fetchFriends,
  fetchFriendshipStatus, sendFriendRequest, respondToFriendRequest, removeFriend,
  fetchFriendRequests,
} from '@/lib/data';
import { fullName, formatBirthDate, classNames } from '@/lib/utils';

export function ProfilePage({ userId }: { userId: string }) {
  const { user, profile: me, refreshProfile } = useAuth();
  const { navigate } = useNav();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted'>('none');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'posts' | 'friends' | 'about'>('posts');
  const [pendingRequest, setPendingRequest] = useState<Friendship | null>(null);

  const isMe = user?.id === userId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, f, fp] = await Promise.all([
        fetchProfile(userId),
        fetchFriends(userId),
        fetchProfilePosts(userId),
      ]);
      setProfile(p);
      setFriends(f);
      setPosts(fp);
      if (!isMe) {
        const status = await fetchFriendshipStatus(userId);
        setFriendStatus(status);
        if (status === 'pending_incoming') {
          const reqs = await fetchFriendRequests(user!.id);
          const match = reqs.find((r) => r.profile.id === userId);
          setPendingRequest(match?.request ?? null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId, isMe, user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>;
  }

  if (!profile) {
    return <div className="atlas-card p-10 text-center mx-auto max-w-lg mt-10">Profile not found.</div>;
  }

  const handleFriendAction = async () => {
    try {
      if (friendStatus === 'none') {
        await sendFriendRequest(userId);
        setFriendStatus('pending_outgoing');
      } else if (friendStatus === 'accepted') {
        if (confirm('Remove this friend?')) {
          await removeFriend(userId);
          setFriendStatus('none');
        }
      } else if (friendStatus === 'pending_incoming' && pendingRequest) {
        await respondToFriendRequest(pendingRequest.id, true);
        setFriendStatus('accepted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecline = async () => {
    if (!pendingRequest) return;
    await respondToFriendRequest(pendingRequest.id, false);
    setFriendStatus('none');
  };

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* cover + avatar */}
      <div className="atlas-card overflow-hidden">
        <div className="relative h-48 sm:h-64 bg-gradient-to-r from-[#1877F2] to-[#42b72a]">
          {profile.cover_url && <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />}
          {isMe && (
            <button className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-800 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 shadow">
              <Camera size={16} /> Edit cover
            </button>
          )}
        </div>
        <div className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-16 sm:-mt-20">
            <div className="relative inline-block">
              <div className="rounded-full border-4 border-white bg-white">
                <Avatar profile={profile} size="2xl" />
              </div>
              {isMe && (
                <button className="absolute bottom-1 right-1 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-2 border-2 border-white">
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className="flex-1 sm:pb-2">
              <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
              <p className="text-gray-500">{friends.length} friends</p>
            </div>
            <div className="flex items-center gap-2 sm:pb-2">
              {isMe ? (
                <>
                  <button onClick={() => navigate({ name: 'messages' })} className="atlas-btn-primary flex items-center gap-1.5">
                    <MessageCircle size={18} /> Message
                  </button>
                  <button onClick={() => setEditing(true)} className="atlas-btn-secondary flex items-center gap-1.5">
                    <Pencil size={16} /> Edit profile
                  </button>
                </>
              ) : (
                <>
                  {friendStatus === 'accepted' ? (
                    <>
                      <button onClick={() => navigate({ name: 'messages' })} className="atlas-btn-primary flex items-center gap-1.5">
                        <MessageCircle size={18} /> Message
                      </button>
                      <button onClick={handleFriendAction} className="atlas-btn-secondary flex items-center gap-1.5">
                        <UserCheck size={18} /> Friends
                      </button>
                    </>
                  ) : friendStatus === 'pending_incoming' ? (
                    <>
                      <button onClick={handleFriendAction} className="atlas-btn-primary flex items-center gap-1.5">
                        <UserPlus size={18} /> Confirm
                      </button>
                      <button onClick={handleDecline} className="atlas-btn-secondary flex items-center gap-1.5">
                        <UserX size={18} /> Delete
                      </button>
                    </>
                  ) : friendStatus === 'pending_outgoing' ? (
                    <button disabled className="atlas-btn-secondary flex items-center gap-1.5">
                      <Clock size={18} /> Request sent
                    </button>
                  ) : (
                    <button onClick={handleFriendAction} className="atlas-btn-primary flex items-center gap-1.5">
                      <UserPlus size={18} /> Add friend
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* tabs */}
          <div className="border-t border-gray-200 mt-3 flex gap-1">
            {(['posts', 'about', 'friends'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={classNames(
                  'px-4 py-3 font-medium capitalize border-b-2 -mb-px',
                  tab === t ? 'border-[#1877F2] text-[#1877F2]' : 'border-transparent text-gray-600 hover:bg-gray-100',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* tab content */}
      <div className="mt-4 grid lg:grid-cols-5 gap-4">
        {tab !== 'posts' && (
          <div className="lg:col-span-2 space-y-4">
            <div className="atlas-card p-4">
              <h2 className="font-bold text-lg mb-3">Intro</h2>
              {profile.bio && <p className="text-gray-700 text-sm mb-3 text-center">{profile.bio}</p>}
              <ul className="space-y-2 text-sm text-gray-700">
                {profile.work && <li className="flex items-center gap-2"><Briefcase size={18} className="text-gray-400" /> Works at {profile.work}</li>}
                {profile.education && <li className="flex items-center gap-2"><GraduationCap size={18} className="text-gray-400" /> Studied at {profile.education}</li>}
                {profile.location && <li className="flex items-center gap-2"><MapPin size={18} className="text-gray-400" /> Lives in {profile.location}</li>}
                {profile.website && <li className="flex items-center gap-2"><Link2 size={18} className="text-gray-400" /> <a href={profile.website} target="_blank" rel="noreferrer" className="atlas-link">{profile.website}</a></li>}
                {profile.phone && isMe && <li className="flex items-center gap-2"><Phone size={18} className="text-gray-400" /> {profile.phone}</li>}
                {profile.birth_date && <li className="flex items-center gap-2"><Calendar size={18} className="text-gray-400" /> Born {formatBirthDate(profile.birth_date)}</li>}
                <li className="flex items-center gap-2"><Clock size={18} className="text-gray-400" /> Joined {fullName(profile.created_at)}</li>
              </ul>
            </div>

            <div className="atlas-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">Friends</h2>
                <button onClick={() => setTab('friends')} className="text-sm atlas-link">See all</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {friends.slice(0, 9).map((f) => (
                  <button key={f.id} onClick={() => navigate({ name: 'profile', userId: f.id })} className="text-left">
                    <Avatar profile={f} size="xl" className="w-full aspect-square rounded-lg" />
                    <p className="text-xs font-medium mt-1 truncate">{f.full_name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={classNames(tab === 'posts' ? 'lg:col-span-5' : 'lg:col-span-3')}>
          {tab === 'posts' && (
            <div className="space-y-4">
              {isMe && <PostComposer onCreated={(p) => setPosts((prev) => [p, ...prev])} />}
              {posts.length === 0 ? (
                <div className="atlas-card p-10 text-center text-gray-500">
                  {isMe ? "You haven't posted anything yet." : "No posts yet."}
                </div>
              ) : (
                posts.map((p) => <PostCard key={p.id} post={p} onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />)
              )}
            </div>
          )}

          {tab === 'about' && (
            <div className="atlas-card p-5">
              <h2 className="font-bold text-xl mb-4">About {profile.full_name}</h2>
              <dl className="space-y-3">
                {profile.bio && <div><dt className="text-sm font-semibold text-gray-500">Bio</dt><dd className="text-gray-800">{profile.bio}</dd></div>}
                {profile.work && <div><dt className="text-sm font-semibold text-gray-500">Work</dt><dd className="text-gray-800">{profile.work}</dd></div>}
                {profile.education && <div><dt className="text-sm font-semibold text-gray-500">Education</dt><dd className="text-gray-800">{profile.education}</dd></div>}
                {profile.location && <div><dt className="text-sm font-semibold text-gray-500">Current city</dt><dd className="text-gray-800">{profile.location}</dd></div>}
                {profile.birth_date && <div><dt className="text-sm font-semibold text-gray-500">Birthday</dt><dd className="text-gray-800">{fullName(profile.birth_date)}</dd></div>}
                {profile.website && <div><dt className="text-sm font-semibold text-gray-500">Website</dt><dd><a href={profile.website} target="_blank" rel="noreferrer" className="atlas-link">{profile.website}</a></dd></div>}
                {isMe && profile.phone && <div><dt className="text-sm font-semibold text-gray-500">Phone</dt><dd className="text-gray-800">{profile.phone}</dd></div>}
              </dl>
              {(!profile.bio && !profile.work && !profile.education && !profile.location && !profile.birth_date) && (
                <p className="text-gray-500 text-sm">No details added yet.</p>
              )}
            </div>
          )}

          {tab === 'friends' && (
            <div className="atlas-card p-5">
              <h2 className="font-bold text-xl mb-4">Friends</h2>
              {friends.length === 0 ? (
                <p className="text-gray-500 text-sm">No friends yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {friends.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100">
                      <Avatar profile={f} size="lg" onClick={() => navigate({ name: 'profile', userId: f.id })} />
                      <button onClick={() => navigate({ name: 'profile', userId: f.id })} className="flex-1 text-left">
                        <p className="font-semibold text-gray-900 hover:underline">{f.full_name}</p>
                        <p className="text-xs text-gray-500">@{f.username}</p>
                      </button>
                      {isMe && (
                        <button onClick={() => { if (confirm(`Remove ${f.full_name}?`)) { removeFriend(f.id).then(load); } }} className="text-xs text-gray-500 hover:text-red-600">
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && isMe && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={async () => { await refreshProfile(); await load(); setEditing(false); }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: profile.full_name,
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    work: profile.work ?? '',
    education: profile.education ?? '',
    phone: profile.phone ?? '',
    website: profile.website ?? '',
    birth_date: profile.birth_date ?? '',
    avatar_url: profile.avatar_url ?? '',
    cover_url: profile.cover_url ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        ...form,
        birth_date: form.birth_date || null,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Edit profile" maxWidth="max-w-xl">
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
        <Field label="Full name"><input className="atlas-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Bio"><textarea className="atlas-input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell people about yourself" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location"><input className="atlas-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Work"><input className="atlas-input" value={form.work} onChange={(e) => setForm({ ...form, work: e.target.value })} /></Field>
          <Field label="Education"><input className="atlas-input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></Field>
          <Field label="Phone"><input className="atlas-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Website"><input className="atlas-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
          <Field label="Birthday"><input type="date" className="atlas-input" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></Field>
        </div>
        <Field label="Avatar URL"><input className="atlas-input" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Cover URL"><input className="atlas-input" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" /></Field>
      </div>
      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
        <button onClick={onClose} className="atlas-btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="atlas-btn-primary">{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
