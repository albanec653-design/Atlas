import { useState, useEffect, useCallback } from 'react';
import { PostComposer } from '@/components/PostComposer';
import { PostCard } from '@/components/PostCard';
import { StoriesBar } from '@/components/StoriesBar';
import { fetchFeedPosts } from '@/lib/data';
import type { Post } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchFeedPosts();
      setPosts(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-2xl mx-auto py-4 px-2 sm:px-3 space-y-4">
      <StoriesBar />
      <PostComposer onCreated={(p) => setPosts((prev) => [p, ...prev])} />

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {error && (
        <div className="atlas-card p-6 text-center text-red-600">
          {error}
          <button onClick={load} className="block mx-auto mt-2 text-sm atlas-link">Try again</button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="atlas-card p-10 text-center">
          <p className="text-xl font-semibold text-gray-800">Welcome to Atlas!</p>
          <p className="text-gray-500 mt-1">Your feed is empty. Create your first post above, or add friends to see their posts here.</p>
        </div>
      )}

      {!error && posts.map((p) => (
        <PostCard key={p.id} post={p} onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
      ))}
    </div>
  );
}
