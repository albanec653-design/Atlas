import { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Eye, Camera, Upload } from 'lucide-react';
import type { Story, Profile, ReactionType } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { fetchStories, createStory, markStoryViewed } from '@/lib/data';
import { classNames } from '@/lib/utils';
import { uploadFile, validateFile, isImage } from '@/lib/storage';

export function StoriesBar() {
  const { profile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewer, setViewer] = useState<{ grouped: { author: Profile; items: Story[] }[]; index: number; sub: number } | null>(null);
  const [composer, setComposer] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await fetchStories();
      if (!active) return;
      setStories(s);
    })();
    return () => { active = false; };
  }, []);

  // group stories by author
  const grouped: { author: Profile; items: Story[] }[] = [];
  for (const s of stories) {
    const author = s.author as unknown as Profile | undefined;
    if (!author) continue;
    let g = grouped.find((x) => x.author.id === author.id);
    if (!g) {
      g = { author, items: [] };
      grouped.push(g);
    }
    g.items.push(s);
  }

  const openViewer = (groupIndex: number, subIndex: number) => {
    setViewer({ grouped, index: groupIndex, sub: subIndex });
    const s = grouped[groupIndex].items[subIndex];
    markStoryViewed(s.id);
  };

  const next = () => {
    if (!viewer) return;
    const g = viewer.grouped[viewer.index];
    if (viewer.sub < g.items.length - 1) {
      const sub = viewer.sub + 1;
      setViewer({ ...viewer, sub });
      markStoryViewed(g.items[sub].id);
    } else if (viewer.index < viewer.grouped.length - 1) {
      const index = viewer.index + 1;
      const sub = 0;
      setViewer({ ...viewer, index, sub });
      markStoryViewed(viewer.grouped[index].items[sub].id);
    }
  };

  const prev = () => {
    if (!viewer) return;
    if (viewer.sub > 0) {
      setViewer({ ...viewer, sub: viewer.sub - 1 });
    } else if (viewer.index > 0) {
      const index = viewer.index - 1;
      const sub = viewer.grouped[index].items.length - 1;
      setViewer({ ...viewer, index, sub });
    }
  };

  return (
    <>
      <div className="atlas-card p-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
          {/* create story */}
          <button
            onClick={() => setComposer(true)}
            className="relative shrink-0 w-28 h-44 rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-200 hover:opacity-90 transition-opacity group"
          >
            {profile?.cover_url ? (
              <img src={profile.cover_url} alt="" className="w-full h-2/3 object-cover" />
            ) : (
              <div className="w-full h-2/3 bg-gradient-to-br from-primary to-[#42b72a] opacity-80" />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-1 text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border-4 border-white">
                <Plus size={16} />
              </div>
              <p className="text-xs font-semibold text-gray-800">Create story</p>
            </div>
          </button>

          {/* story cards */}
          {grouped.map((g, i) => {
            const first = g.items[0];
            const viewed = false; // simplified
            return (
              <button
                key={g.author.id}
                onClick={() => openViewer(i, 0)}
                className="relative shrink-0 w-28 h-44 rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
              >
                {first.image_url ? (
                  <img src={first.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-center" style={{ background: first.background_color ?? 'primary' }}>
                    <p className="text-white font-semibold text-sm whitespace-pre-wrap">{first.content}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className={classNames('absolute top-2 left-2 p-0.5 rounded-full', viewed ? 'bg-gray-400' : 'bg-primary')}>
                  <Avatar profile={g.author} size="xs" />
                </div>
                <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate text-left drop-shadow">
                  {g.author.full_name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {viewer && (
        <StoryViewer
          data={viewer}
          onClose={() => setViewer(null)}
          onNext={next}
          onPrev={prev}
        />
      )}

      {composer && <StoryComposer onClose={() => setComposer(false)} onCreated={() => { setComposer(false); window.location.reload(); }} />}
    </>
  );
}

function StoryViewer({
  data,
  onClose,
  onNext,
  onPrev,
}: {
  data: { grouped: { author: Profile; items: Story[] }[]; index: number; sub: number };
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const g = data.grouped[data.index];
  const story = g.items[data.sub];
  const progress = ((data.sub + 1) / g.items.length) * 100;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full z-10">
        <X size={24} />
      </button>
      {data.index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full">
          <ChevronLeft size={28} />
        </button>
      )}
      {data.index < data.grouped.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full">
          <ChevronRight size={28} />
        </button>
      )}

      <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* progress bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
          {g.items.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
              <div className={classNames('h-full bg-white transition-all', i < data.sub ? 'w-full' : i === data.sub ? 'w-full' : 'w-0')} />
            </div>
          ))}
        </div>

        {/* author */}
        <div className="absolute top-5 left-2 right-2 flex items-center gap-2 z-10">
          <Avatar profile={g.author} size="sm" />
          <span className="text-white text-sm font-semibold drop-shadow">{g.author.full_name}</span>
        </div>

        {story.image_url ? (
          <img src={story.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8 text-center" style={{ background: story.background_color ?? 'primary' }}>
            <p className="text-white font-bold text-2xl whitespace-pre-wrap leading-snug">{story.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryComposer({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { profile, user } = useAuth();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bg, setBg] = useState('primary');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BGS = ['primary', '#42b72a', '#f02849', '#9b3ee8', '#ff6b6b', '#1a535c'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!isImage(file)) {
      alert('Please select an image file');
      return;
    }

    const validation = validateFile(file, ['jpg', 'jpeg', 'png', 'gif', 'webp'], 20);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile('stories', file, user.id);
      if (result) {
        setImageUrl(result.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !imageUrl.trim()) return;
    setSubmitting(true);
    try {
      await createStory({ content: text.trim() || null, image_url: imageUrl.trim() || null, background_color: imageUrl ? null : bg });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Add to your story</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Avatar profile={profile!} size="md" />
            <span className="font-semibold">{profile?.full_name}</span>
          </div>

          {!imageUrl && (
            <div className="aspect-[9/16] max-h-72 rounded-xl flex items-center justify-center p-6 text-center mb-3" style={{ background: bg }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start typing…"
                className="w-full bg-transparent outline-none text-white text-2xl font-bold text-center resize-none placeholder:text-white/70"
                rows={3}
              />
            </div>
          )}

          {imageUrl && (
            <div className="rounded-xl overflow-hidden mb-3">
              <img src={imageUrl} alt="" className="w-full max-h-72 object-cover" />
            </div>
          )}

          {!imageUrl && (
            <div className="flex gap-2 mb-3">
              {BGS.map((c) => (
                <button key={c} onClick={() => setBg(c)} className={classNames('w-7 h-7 rounded-full border-2', bg === c ? 'border-primary scale-110' : 'border-gray-200')} style={{ background: c }} />
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              <Upload size={18} /> {uploading ? 'Uploading…' : 'Upload Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <input className="atlas-input mb-3" placeholder="Or paste an image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

          <button onClick={handlePost} disabled={submitting || uploading || (!text.trim() && !imageUrl.trim())} className="atlas-btn-primary w-full">
            {submitting ? 'Sharing…' : 'Share story'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ReactionType };
export { Eye, Camera };
