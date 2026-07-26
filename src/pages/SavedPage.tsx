import { useState, useEffect, useCallback } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import type { Post } from '@/lib/types';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import { fetchSavedPosts } from '@/lib/data';

export function SavedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = await fetchSavedPosts(user.id);
      setPosts(p);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-2xl mx-auto py-4 px-3">
      <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Bookmark size={24} /> Saved posts
      </h1>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}

      {!loading && posts.length === 0 && (
        <div className="atlas-card p-10 text-center">
          <Bookmark size={40} className="mx-auto text-gray-300" />
          <p className="text-gray-500 mt-2">No saved posts yet.</p>
          <p className="text-gray-400 text-sm mt-1">Tap the menu on any post and choose "Save post".</p>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((p) => <PostCard key={p.id} post={{ ...p, is_saved: true }} onDelete={() => load()} />)}
      </div>
    </div>
  );
}
