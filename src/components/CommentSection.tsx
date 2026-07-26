import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import type { Comment, Profile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { timeAgo, classNames } from '@/lib/utils';
import { createComment, deleteComment } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';

export function CommentSection({
  postId,
  comments,
  onAdd,
  onDelete,
}: {
  postId: string;
  comments: Comment[];
  onAdd: (c: Comment) => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await createComment(postId, text.trim());
      if (c) onAdd(c);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <div className="px-3 pb-3 space-y-2">
      {topLevel.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          replies={repliesOf(c.id)}
          postId={postId}
          currentUserId={user?.id ?? ''}
          onReply={(r) => onAdd(r)}
          onDelete={onDelete}
        />
      ))}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <Avatar profile={{ avatar_url: null, full_name: 'You' }} size="sm" />
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
          <input
            className="flex-1 bg-transparent outline-none text-sm py-1.5 placeholder:text-gray-500"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="text-primary disabled:text-gray-300 p-1"
            aria-label="Send comment"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  postId,
  currentUserId,
  onReply,
  onDelete,
}: {
  comment: Comment;
  replies: Comment[];
  postId: string;
  currentUserId: string;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
}) {
  const author = comment.author as unknown as Profile | undefined;
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await createComment(postId, replyText.trim(), comment.id);
      if (r) {
        onReply(r);
        setReplyText('');
        setShowReplyBox(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Avatar profile={author ?? { avatar_url: null, full_name: 'User' }} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full">
          <p className="text-sm font-semibold text-gray-900">{author?.full_name ?? 'Unknown'}</p>
          <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 px-2">
          <span>{timeAgo(comment.created_at)}</span>
          <button onClick={() => setShowReplyBox((s) => !s)} className="font-semibold hover:underline">
            Reply
          </button>
          {comment.author_id === currentUserId && (
            <button onClick={() => onDelete(comment.id)} className="font-semibold hover:underline text-red-500">
              Delete
            </button>
          )}
        </div>

        {showReplyBox && (
          <form onSubmit={handleReply} className="flex items-center gap-2 mt-1.5 animate-fade-in">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
              <input
                className="flex-1 bg-transparent outline-none text-sm py-1.5 placeholder:text-gray-500"
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={!replyText.trim() || submitting} className="text-primary disabled:text-gray-300">
                <Send size={16} />
              </button>
            </div>
          </form>
        )}

        {replies.length > 0 && (
          <div className="mt-1.5 space-y-2 pl-2 border-l-2 border-gray-100">
            {replies.map((r) => (
              <div key={r.id} className="flex gap-2">
                <Avatar profile={r.author ?? { avatar_url: null, full_name: 'User' }} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full">
                    <p className="text-sm font-semibold text-gray-900">{r.author?.full_name ?? 'Unknown'}</p>
                    <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{r.content}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 px-2">
                    <span>{timeAgo(r.created_at)}</span>
                    {r.author_id === currentUserId && (
                      <button onClick={() => onDelete(r.id)} className="font-semibold hover:underline text-red-500">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { classNames };
export { Trash2 };
