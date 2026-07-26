import { useState } from 'react';
import { Image as ImageIcon, Smile, Globe2, X, Type, Eye, Users, Lock } from 'lucide-react';
import type { Post, ReactionType } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { createPost } from '@/lib/data';
import { classNames } from '@/lib/utils';

const BACKGROUNDS = [
  '#1877F2', '#42b72a', '#e4e6eb', '#f02849', '#9b3ee8',
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c', '#f72585',
];

const VISIBILITY_OPTIONS: { value: 'public' | 'friends' | 'private'; label: string; icon: typeof Globe2 }[] = [
  { value: 'public', label: 'Public', icon: Globe2 },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'private', label: 'Only me', icon: Lock },
];

export function PostComposer({
  onCreated,
  groupId = null,
  placeholder = "What's on your mind, ",
}: {
  onCreated: (post: Post) => void;
  groupId?: string | null;
  placeholder?: string;
}) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bg, setBg] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [showVisMenu, setShowVisMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  const handleSubmit = async () => {
    if (!text.trim() && !imageUrl.trim()) return;
    setSubmitting(true);
    try {
      const post = await createPost({
        content: bg ? text.trim() : text.trim() || null,
        image_url: imageUrl.trim() || null,
        background_color: bg,
        visibility,
        group_id: groupId,
      });
      if (post) {
        onCreated({ ...post, reaction_counts: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 }, viewer_reaction: null, comments: [] });
        setText('');
        setImageUrl('');
        setBg(null);
        setOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <div className="atlas-card p-4">
        <div className="flex items-center gap-2">
          <Avatar profile={profile} size="md" />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2.5 text-gray-500 transition-colors"
          >
            {placeholder}{profile.full_name.split(' ')[0]}?
          </button>
        </div>
        <div className="border-t border-gray-200 mt-3 pt-2 flex items-center justify-around">
          <button onClick={() => { setOpen(true); setBg('#1877F2'); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium">
            <Type size={20} className="text-[#1877F2]" /> Background
          </button>
          <button onClick={() => { setOpen(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium">
            <ImageIcon size={20} className="text-green-500" /> Photo
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium">
            <Smile size={20} className="text-amber-500" /> Feeling
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => !submitting && setOpen(false)} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Create post</h2>
          <button onClick={() => !submitting && setOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Avatar profile={profile} size="md" />
            <div>
              <p className="font-semibold text-gray-900">{profile.full_name}</p>
              <div className="relative">
                <button
                  onClick={() => setShowVisMenu((s) => !s)}
                  className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                >
                  {(() => {
                    const opt = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;
                    return <><opt.icon size={12} /> {opt.label}</>;
                  })()}
                </button>
                {showVisMenu && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-32">
                    {VISIBILITY_OPTIONS.map((v) => (
                      <button
                        key={v.value}
                        onClick={() => { setVisibility(v.value); setShowVisMenu(false); }}
                        className={classNames('flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-100', visibility === v.value ? 'text-[#1877F2] font-medium' : 'text-gray-700')}
                      >
                        <v.icon size={14} /> {v.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What's on your mind, ${profile.full_name.split(' ')[0]}?`}
            rows={4}
            className={classNames(
              'w-full outline-none resize-none text-lg placeholder:text-gray-400',
              bg && 'min-h-[180px] text-center text-2xl font-bold text-white py-12 rounded-lg flex items-center justify-center',
            )}
            style={bg ? { background: bg } : undefined}
          />

          {imageUrl && (
            <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200">
              <img src={imageUrl} alt="" className="w-full max-h-80 object-cover" />
              <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-gray-800/60 text-white p-1 rounded-full">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Background color picker */}
          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              {BACKGROUNDS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBg(bg === c ? null : c)}
                  className={classNames('w-7 h-7 rounded-full border-2', bg === c ? 'border-[#1877F2] scale-110' : 'border-gray-200')}
                  style={{ background: c }}
                />
              ))}
              <button onClick={() => setBg(null)} className="text-xs text-gray-500 hover:underline ml-1">None</button>
            </div>
          </div>

          {/* Image URL input */}
          <div className="mt-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <ImageIcon size={18} className="text-green-500" />
            <input
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
              placeholder="Paste an image URL…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || (!text.trim() && !imageUrl.trim())}
            className="atlas-btn-primary w-full mt-4 py-2.5"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// re-export for tree-shaking friendliness
export type { Post, ReactionType };
export { Globe2, Eye };
