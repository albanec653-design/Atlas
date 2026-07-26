import { useState } from 'react';
import { ThumbsUp, Heart, Smile, Laugh, Frown, Flame } from 'lucide-react';
import type { ReactionType } from '@/lib/types';
import { classNames } from '@/lib/utils';
import { setReaction } from '@/lib/data';

const REACTIONS: { type: ReactionType; label: string; icon: typeof ThumbsUp; color: string; bg: string }[] = [
  { type: 'like', label: 'Like', icon: ThumbsUp, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]' },
  { type: 'love', label: 'Love', icon: Heart, color: 'text-red-500', bg: 'bg-red-500' },
  { type: 'haha', label: 'Haha', icon: Laugh, color: 'text-amber-500', bg: 'bg-amber-500' },
  { type: 'wow', label: 'Wow', icon: Smile, color: 'text-amber-500', bg: 'bg-amber-500' },
  { type: 'sad', label: 'Sad', icon: Frown, color: 'text-amber-500', bg: 'bg-amber-500' },
  { type: 'angry', label: 'Angry', icon: Flame, color: 'text-red-600', bg: 'bg-red-600' },
];

export function getReactionMeta(type: ReactionType) {
  return REACTIONS.find((r) => r.type === type)!;
}

export function ReactionButton({
  postId,
  viewerReaction,
  onChange,
}: {
  postId: string;
  viewerReaction: ReactionType | null;
  onChange: (type: ReactionType | null) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);

  const current = viewerReaction ? getReactionMeta(viewerReaction) : REACTIONS[0];

  const handleReact = async (type: ReactionType) => {
    setShowPicker(false);
    if (loading) return;
    setLoading(true);
    const prev = viewerReaction;
    // optimistic
    onChange(type === viewerReaction ? null : type);
    try {
      await setReaction(postId, type);
    } catch {
      onChange(prev);
    } finally {
      setLoading(false);
    }
  };

  const openPicker = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setShowPicker(true);
  };
  const closePickerDelayed = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    const t = setTimeout(() => setShowPicker(false), 300);
    setHoverTimer(t);
  };

  return (
    <div
      className="relative"
      onMouseEnter={openPicker}
      onMouseLeave={closePickerDelayed}
    >
      <button
        onClick={() => handleReact(current.type)}
        className={classNames(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors',
          viewerReaction ? current.color : 'text-gray-600 hover:bg-gray-100',
        )}
      >
        <current.icon size={18} fill={viewerReaction ? 'currentColor' : 'none'} />
        <span>{viewerReaction ? current.label : 'Like'}</span>
      </button>

      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-1 bg-white rounded-full shadow-xl border border-gray-200 px-1.5 py-1 flex items-center gap-0.5 animate-scale-in z-20"
          onMouseEnter={openPicker}
          onMouseLeave={closePickerDelayed}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => handleReact(r.type)}
              className={classNames('p-1 rounded-full hover:scale-125 transition-transform duration-150', r.color)}
              title={r.label}
            >
              <r.icon size={26} fill="currentColor" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReactionSummary({
  counts,
  onSummaryClick,
}: {
  counts: Record<ReactionType, number>;
  onSummaryClick?: () => void;
}) {
  const entries = REACTIONS.filter((r) => counts[r.type] > 0);
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, r) => sum + counts[r.type], 0);

  return (
    <button
      onClick={onSummaryClick}
      className="flex items-center gap-1.5 text-sm text-gray-600 hover:underline"
    >
      <div className="flex -space-x-1">
        {entries.slice(0, 3).map((r) => (
          <span
            key={r.type}
            className={classNames('w-5 h-5 rounded-full flex items-center justify-center text-white border-2 border-white', r.bg)}
          >
            <r.icon size={12} fill="currentColor" />
          </span>
        ))}
      </div>
      <span>{total}</span>
    </button>
  );
}
