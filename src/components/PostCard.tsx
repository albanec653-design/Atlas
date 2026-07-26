import { useState, useEffect } from 'react';
import { MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2, Pencil, Globe2, Users, Lock } from 'lucide-react';
import type { Post, ReactionType, Comment, Profile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { ReactionButton, ReactionSummary, getReactionMeta } from '@/components/Reactions';
import { CommentSection } from '@/components/CommentSection';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { fetchComments, fetchReactionsForPosts, deletePost, toggleSavePost, isPostSaved } from '@/lib/data';
import { timeAgo, classNames } from '@/lib/utils';

const VIS_ICON = { public: Globe2, friends: Users, private: Lock };

export function PostCard({ post, onDelete }: { post: Post; onDelete?: (id: string) => void }) {
  const { user } = useAuth();
  const { navigate } = useNav();
  const author = post.author as unknown as Profile | undefined;
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments ?? []);
  const [counts, setCounts] = useState<Record<ReactionType, number>>(
    post.reaction_counts ?? { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
  );
  const [viewerReaction, setViewerReaction] = useState<ReactionType | null>(post.viewer_reaction ?? null);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [r, s] = await Promise.all([
        fetchReactionsForPosts([post.id], user?.id ?? ''),
        user ? isPostSaved(post.id, user.id) : Promise.resolve(false),
      ]);
      if (!active) return;
      setCounts(r.counts[post.id] ?? counts);
      setViewerReaction(r.viewer[post.id] ?? null);
      setSaved(s);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      const c = await fetchComments(post.id);
      setComments(c);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm('Delete this post?')) return;
    try {
      await deletePost(post.id);
      onDelete?.(post.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const next = await toggleSavePost(post.id, user.id);
    setSaved(next);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Check this out on Atlas', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard');
      }
    } catch {
      // user cancelled share
    }
  };

  const VisIcon = VIS_ICON[post.visibility];

  return (
    <article className="atlas-card overflow-hidden animate-fade-in">
      {/* header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar profile={author ?? { avatar_url: null, full_name: 'U' }} size="md" onClick={() => author && navigate({ name: 'profile', userId: author.id })} />
          <div className="min-w-0">
            <p
              className="font-semibold text-gray-900 hover:underline cursor-pointer truncate"
              onClick={() => author && navigate({ name: 'profile', userId: author.id })}
            >
              {author?.full_name ?? 'Unknown user'}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{timeAgo(post.created_at)}</span>
              <span>·</span>
              <VisIcon size={12} />
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen((s) => !s)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-40" onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={handleSave} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 text-gray-700">
                <Bookmark size={16} /> {saved ? 'Unsave' : 'Save post'}
              </button>
              {post.author_id === user?.id && (
                <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 text-red-600">
                  <Trash2 size={16} /> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* content */}
      {post.content && !post.background_color && (
        <p className="px-3 pb-2 text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
      )}
      {post.content && post.background_color && (
        <div className="min-h-[220px] flex items-center justify-center p-8 text-center" style={{ background: post.background_color }}>
          <p className="text-2xl font-bold text-white whitespace-pre-wrap break-words leading-snug">{post.content}</p>
        </div>
      )}

      {/* image */}
      {post.image_url && (
        <div className="w-full bg-black/5">
          <img src={post.image_url} alt="" className="w-full max-h-[500px] object-cover" />
        </div>
      )}

      {/* reaction summary */}
      <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-500">
        <ReactionSummary counts={counts} />
        <div className="flex items-center gap-3">
          {comments.length > 0 && (
            <button onClick={toggleComments} className="hover:underline">
              {comments.length} comments
            </button>
          )}
        </div>
      </div>

      {/* action bar */}
      <div className="flex items-center justify-around border-t border-gray-200 px-2 py-1">
        <ReactionButton postId={post.id} viewerReaction={viewerReaction} onChange={setViewerReaction} />
        <button onClick={toggleComments} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-100">
          <MessageCircle size={18} /> Comment
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-100">
          <Share2 size={18} /> Share
        </button>
      </div>

      {/* comments */}
      {showComments && (
        <div className="border-t border-gray-200 pt-2 animate-fade-in">
          <CommentSection
            postId={post.id}
            comments={comments}
            onAdd={(c) => setComments((prev) => [...prev, c])}
            onDelete={(id) => setComments((prev) => prev.filter((x) => x.id !== id && x.parent_id !== id))}
          />
        </div>
      )}
    </article>
  );
}

export { classNames, Pencil };
