import { supabase } from '@/lib/supabase';
import type { Post, ReactionType, Comment, Profile, Friendship, Group, Conversation, Message, Notification, Story } from '@/lib/types';

// ============ POSTS ============

export async function fetchFeedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .is('group_id', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as unknown as Post[];
}

export async function fetchProfilePosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('author_id', userId)
    .is('group_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Post[];
}

export async function fetchGroupPosts(groupId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Post[];
}

export async function fetchSavedPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('saved_posts')
    .select('post:posts(*, author:profiles!posts_author_id_fkey(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data?.map((r) => (r as unknown as { post: Post }).post).filter(Boolean) ?? []) as Post[];
}

export async function createPost(input: {
  content?: string | null;
  image_url?: string | null;
  background_color?: string | null;
  visibility?: 'public' | 'friends' | 'private';
  group_id?: string | null;
}): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      content: input.content ?? null,
      image_url: input.image_url ?? null,
      background_color: input.background_color ?? null,
      visibility: input.visibility ?? 'public',
      group_id: input.group_id ?? null,
    })
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .single();
  if (error) throw error;
  return data as unknown as Post;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function updatePost(postId: string, content: string): Promise<void> {
  const { error } = await supabase.from('posts').update({ content }).eq('id', postId);
  if (error) throw error;
}

// ============ REACTIONS ============

export async function fetchReactionsForPosts(postIds: string[], viewerId: string) {
  if (postIds.length === 0) return { counts: {} as Record<string, Record<ReactionType, number>>, viewer: {} as Record<string, ReactionType | null> };
  const { data, error } = await supabase
    .from('reactions')
    .select('post_id, user_id, type')
    .in('post_id', postIds);
  if (error) throw error;

  const counts: Record<string, Record<ReactionType, number>> = {};
  const viewer: Record<string, ReactionType | null> = {};
  for (const r of data ?? []) {
    const pid = r.post_id as string;
    if (!counts[pid]) counts[pid] = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
    counts[pid][r.type as ReactionType] += 1;
    if (r.user_id === viewerId) viewer[pid] = r.type as ReactionType;
  }
  return { counts, viewer };
}

export async function setReaction(postId: string, type: ReactionType): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try update existing, else insert
  const { data: existing } = await supabase
    .from('reactions')
    .select('id, type')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    if (existing.type === type) {
      // toggle off
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').update({ type }).eq('id', existing.id);
    }
  } else {
    await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, type });
  }
}

// ============ COMMENTS ============

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Comment[];
}

export async function createComment(postId: string, content: string, parentId?: string | null): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content, parent_id: parentId ?? null })
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .single();
  if (error) throw error;
  return data as unknown as Comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ============ SAVED POSTS ============

export async function isPostSaved(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function toggleSavePost(postId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    await supabase.from('saved_posts').delete().eq('id', existing.id);
    return false;
  }
  await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId });
  return true;
}

// ============ FRIENDSHIPS ============

export async function fetchFriends(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  const friends: Profile[] = [];
  for (const row of data ?? []) {
    const r = row as unknown as { requester: Profile; addressee: Profile };
    if (r.requester.id !== userId) friends.push(r.requester);
    if (r.addressee.id !== userId) friends.push(r.addressee);
  }
  return friends;
}

export async function fetchFriendRequests(userId: string): Promise<{ request: Friendship; profile: Profile }[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*)')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as unknown as Friendship & { requester: Profile };
    return { request: r, profile: r.requester };
  });
}

export async function fetchSentRequests(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('addressee_id')
    .eq('requester_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return (data ?? []).map((r) => (r as unknown as { addressee_id: string }).addressee_id);
}

export async function fetchFriendshipStatus(otherId: string): Promise<'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted'> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'none';
  const { data, error } = await supabase
    .from('friendships')
    .select('status, requester_id')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${user.id})`)
    .maybeSingle();
  if (error || !data) return 'none';
  const row = data as unknown as { status: string; requester_id: string };
  if (row.status === 'accepted') return 'accepted';
  if (row.status === 'pending') {
    return row.requester_id === user.id ? 'pending_outgoing' : 'pending_incoming';
  }
  return 'none';
}

export async function sendFriendRequest(addresseeId: string): Promise<void> {
  const { error } = await supabase.from('friendships').insert({ addressee_id: addresseeId });
  if (error) throw error;
}

export async function respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
  if (accept) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('friendships').delete().eq('id', requestId);
    if (error) throw error;
  }
}

export async function removeFriend(friendshipOrUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendshipOrUserId}),and(requester_id.eq.${friendshipOrUserId},addressee_id.eq.${user.id})`);
  if (error) throw error;
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// ============ GROUPS ============

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, creator:profiles!groups_creator_id_fkey(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Group[];
}

export async function fetchGroup(groupId: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, creator:profiles!groups_creator_id_fkey(*)')
    .eq('id', groupId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Group | null;
}

export async function fetchGroupMembers(groupId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('user:profiles!group_members_user_id_fkey(*)')
    .eq('group_id', groupId);
  if (error) throw error;
  return (data?.map((r) => (r as unknown as { user: Profile }).user) ?? []) as Profile[];
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function createGroup(input: {
  name: string;
  description?: string;
  cover_url?: string;
  privacy?: 'public' | 'private';
}): Promise<Group | null> {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name: input.name, description: input.description ?? null, cover_url: input.cover_url ?? null, privacy: input.privacy ?? 'public' })
    .select('*, creator:profiles!groups_creator_id_fkey(*)')
    .single();
  if (error) throw error;
  const group = data as unknown as Group;
  // creator auto-joins as admin
  await supabase.from('group_members').insert({ group_id: group.id, role: 'admin' });
  return group;
}

export async function joinGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId });
  if (error) throw error;
}

export async function leaveGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '');
  if (error) throw error;
}

// ============ MESSAGING ============

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: memberRows, error } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);
  if (error) throw error;
  const ids = (memberRows ?? []).map((r) => (r as unknown as { conversation_id: string }).conversation_id);
  if (ids.length === 0) return [];

  const { data: convs, error: cerr } = await supabase
    .from('conversations')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (cerr) throw cerr;

  const result: Conversation[] = [];
  for (const c of convs ?? []) {
    const conv = c as unknown as Conversation;
    const { data: memData } = await supabase
      .from('conversation_members')
      .select('user:profiles!conversation_members_user_id_fkey(*)')
      .eq('conversation_id', conv.id);
    const members = (memData ?? []).map((r) => (r as unknown as { user: Profile }).user);
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    result.push({ ...conv, members, last_message: lastMsg as unknown as Message | undefined });
  }
  return result;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Message[];
}

export async function sendMessage(conversationId: string, content: string, imageUrl?: string | null): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, content, image_url: imageUrl ?? null })
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .single();
  if (error) throw error;
  return data as unknown as Message;
}

export async function getOrCreateConversation(otherUserId: string): Promise<Conversation | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Find existing 1:1 conversation with both users
  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);
  const myConvIds = (myMemberships ?? []).map((r) => (r as unknown as { conversation_id: string }).conversation_id);

  if (myConvIds.length > 0) {
    const { data: theirMemberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds);
    const shared = (theirMemberships ?? []).map((r) => (r as unknown as { conversation_id: string }).conversation_id);
    for (const cid of shared) {
      const { data: conv } = await supabase.from('conversations').select('*').eq('id', cid).maybeSingle();
      if (conv && !(conv as Conversation).is_group) {
        return conv as unknown as Conversation;
      }
    }
  }

  // Create new
  const { data: conv, error } = await supabase.from('conversations').insert({ is_group: false }).select('*').single();
  if (error) throw error;
  const newConv = conv as unknown as Conversation;
  await supabase.from('conversation_members').insert([
    { conversation_id: newConv.id, user_id: user.id },
    { conversation_id: newConv.id, user_id: otherUserId },
  ]);
  return newConv;
}

// ============ NOTIFICATIONS ============

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  if (error) throw error;
}

export async function unreadNotificationCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);
  if (error) return 0;
  return count ?? 0;
}

// ============ STORIES ============

export async function fetchStories(): Promise<Story[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('stories')
    .select('*, author:profiles!stories_author_id_fkey(*)')
    .gt('created_at', since)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Story[];
}

export async function createStory(input: { image_url?: string | null; content?: string | null; background_color?: string | null }): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      image_url: input.image_url ?? null,
      content: input.content ?? null,
      background_color: input.background_color ?? null,
    })
    .select('*, author:profiles!stories_author_id_fkey(*)')
    .single();
  if (error) throw error;
  return data as unknown as Story;
}

export async function markStoryViewed(storyId: string): Promise<void> {
  const { error } = await supabase.from('story_views').insert({ story_id: storyId }).select('*').maybeSingle();
  if (error && !error.message.includes('duplicate')) {
    // ignore unique constraint (already viewed)
  }
}

// ============ PROFILE ============

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}
