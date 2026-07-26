import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, UserPlus, UserCheck, Bell, CheckCheck, Loader2 } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/data';
import { timeAgo, classNames } from '@/lib/utils';

const ICON: Record<Notification['type'], typeof Heart> = {
  like: Heart,
  reaction: Heart,
  comment: MessageCircle,
  friend_request: UserPlus,
  friend_accept: UserCheck,
  message: MessageCircle,
  group_invite: Bell,
  tag: Bell,
};

const COLOR: Record<Notification['type'], string> = {
  like: 'bg-red-500',
  reaction: 'bg-red-500',
  comment: 'bg-primary',
  friend_request: 'bg-primary',
  friend_accept: 'bg-green-500',
  message: 'bg-primary',
  group_invite: 'bg-amber-500',
  tag: 'bg-amber-500',
};

export function NotificationsPage() {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const n = await fetchNotifications();
      setNotifications(n);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.actor_id) navigate({ name: 'profile', userId: n.actor_id });
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const shown = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto py-4 px-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={classNames(
              'px-4 py-1.5 rounded-full text-sm font-medium',
              filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100',
            )}
          >
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}

      {!loading && shown.length === 0 && (
        <div className="atlas-card p-10 text-center">
          <Bell size={40} className="mx-auto text-gray-300" />
          <p className="text-gray-500 mt-2">No notifications {filter === 'unread' ? 'unread' : 'yet'}.</p>
        </div>
      )}

      <div className="space-y-1">
        {shown.map((n) => {
          const Icon = ICON[n.type] ?? Bell;
          const actor = n.actor;
          return (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={classNames(
                'flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors',
                n.read ? 'bg-white hover:bg-gray-50' : 'bg-[#e7f0fd] hover:bg-[#d4e6fb]',
              )}
            >
              <div className="relative shrink-0">
                <Avatar profile={actor ?? { avatar_url: null, full_name: '?' }} size="md" />
                <span className={classNames('absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white border-2 border-white', COLOR[n.type])}>
                  <Icon size={11} fill="currentColor" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{actor?.full_name ?? 'Someone'}</span>{' '}
                  {notifDescription(n)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function notifDescription(n: Notification): string {
  switch (n.type) {
    case 'like': return 'liked your post.';
    case 'reaction': return 'reacted to your post.';
    case 'comment': return 'commented on your post.';
    case 'friend_request': return 'sent you a friend request.';
    case 'friend_accept': return 'accepted your friend request.';
    case 'message': return 'sent you a message.';
    case 'group_invite': return 'invited you to a group.';
    case 'tag': return 'tagged you in a post.';
    default: return 'has activity for you.';
  }
}
