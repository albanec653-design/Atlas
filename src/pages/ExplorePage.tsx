import { useState, useEffect } from 'react';
import { TrendingUp, Hash, Users, Clock } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { fetchFeedPosts } from '@/lib/data';
import type { Post } from '@/lib/types';

export function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'popular'>('trending');

  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchFeedPosts();
      // Simple sorting based on tab
      let sorted = [...data];
      if (activeTab === 'trending') {
        // Sort by some engagement metric (simplified)
        sorted.sort((a, b) => {
          // In real app, this would use reaction counts, comment counts, etc.
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      } else if (activeTab === 'recent') {
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (activeTab === 'popular') {
        // Sort by popularity (simplified - would use actual engagement metrics)
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      setPosts(sorted);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'trending' as const, label: 'Trending', icon: TrendingUp },
    { id: 'recent' as const, label: 'Recent', icon: Clock },
    { id: 'popular' as const, label: 'Popular', icon: Users },
  ];

  const trendingHashtags = ['#viral', '#trending', '#explore', '#discover', '#hot'];
  const trendingTopics = [
    { name: 'Technology', posts: '12.5K' },
    { name: 'Gaming', posts: '8.3K' },
    { name: 'Music', posts: '6.2K' },
    { name: 'Sports', posts: '5.1K' },
    { name: 'Art', posts: '4.8K' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Explore</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Discover what's trending on Atlas</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Trending Topics */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          Trending Topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <button
              key={topic.name}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {topic.name} <span className="text-gray-500 dark:text-gray-400">({topic.posts})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Hash size={20} className="text-primary" />
          Trending Hashtags
        </h2>
        <div className="flex flex-wrap gap-2">
          {trendingHashtags.map((tag) => (
            <button
              key={tag}
              className="px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full text-sm text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
