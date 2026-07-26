/*
# Atlas Social Graph & Messaging — Friendships, Groups, Messages, Notifications, Stories, Saved Posts

1. Overview
Extends Atlas with the social graph (friendships), communities (groups with membership),
real-time messaging (conversations + direct messages), notifications, ephemeral stories,
and saved/bookmarked posts.

2. New Tables
- friendships: friend requests between users (requester, addressee, status pending|accepted|declined).
- group_categories: category list for groups.
- groups: community groups (name, description, cover, privacy public|private, creator).
- group_members: membership join table (group_id, user_id, role admin|member).
- conversations: chat threads (is_group, name).
- conversation_members: participants in a conversation.
- messages: chat messages (conversation_id, sender_id, content, image_url).
- notifications: activity notifications (user_id recipient, actor_id, type, entity_id, read).
- stories: ephemeral 24h stories (author_id, image_url, content, background_color).
- story_views: track who viewed a story.
- saved_posts: bookmarks (post_id, user_id).

3. Security (RLS)
- friendships: both participants can see; requester can insert; both can update status; both can delete.
- groups: authenticated can SELECT public groups + groups they're in; creator can INSERT/UPDATE/DELETE.
- group_members: all can SELECT; authenticated can INSERT own; admin or self can DELETE.
- conversations: members can SELECT; authenticated can INSERT.
- conversation_members: members can SELECT; authenticated can INSERT own.
- messages: conversation members can SELECT; sender can INSERT own.
- notifications: recipient SELECT own; actor INSERT; recipient UPDATE read + DELETE.
- stories: authenticated SELECT last 24h; author INSERT/DELETE own.
- story_views: viewer or story author SELECT; user INSERT own.
- saved_posts: owner SELECT/INSERT/DELETE.

4. Notes
- posts.group_id FK linked to groups.
- Helper function are_friends(a,b) added for reuse.
- posts SELECT policy updated to honor 'friends' visibility via are_friends.
*/

-- ============ FRIENDSHIPS ============
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- ============ HELPER: are friends ============
CREATE OR REPLACE FUNCTION public.are_friends(a uuid, b uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND ((requester_id = a AND addressee_id = b) OR (requester_id = b AND addressee_id = a))
  );
$$;

-- ============ GROUPS ============
CREATE TABLE IF NOT EXISTS group_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_url text,
  category_id uuid REFERENCES group_categories(id),
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public','private')),
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- link posts.group_id to groups
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'posts_group_id_fkey') THEN
    ALTER TABLE posts ADD CONSTRAINT posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- ============ CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like','comment','friend_request','friend_accept','message','group_invite','tag','reaction')),
  entity_id uuid,
  entity_type text,
  content text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============ STORIES ============
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text,
  content text,
  background_color text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at DESC);

CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

-- ============ SAVED POSTS ============
CREATE TABLE IF NOT EXISTS saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- ============ RLS ENABLE ============
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- ============ FRIENDSHIPS POLICIES ============
DROP POLICY IF EXISTS "friendships_select_participants" ON friendships;
CREATE POLICY "friendships_select_participants"
ON friendships FOR SELECT
TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "friendships_insert_requester" ON friendships;
CREATE POLICY "friendships_insert_requester"
ON friendships FOR INSERT
TO authenticated WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "friendships_update_participants" ON friendships;
CREATE POLICY "friendships_update_participants"
ON friendships FOR UPDATE
TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid())
WITH CHECK (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "friendships_delete_participants" ON friendships;
CREATE POLICY "friendships_delete_participants"
ON friendships FOR DELETE
TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- ============ GROUPS POLICIES ============
DROP POLICY IF EXISTS "groups_select_visible" ON groups;
CREATE POLICY "groups_select_visible"
ON groups FOR SELECT
TO authenticated USING (
  privacy = 'public'
  OR creator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "groups_insert_own" ON groups;
CREATE POLICY "groups_insert_own"
ON groups FOR INSERT
TO authenticated WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "groups_update_own" ON groups;
CREATE POLICY "groups_update_own"
ON groups FOR UPDATE
TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "groups_delete_own" ON groups;
CREATE POLICY "groups_delete_own"
ON groups FOR DELETE
TO authenticated USING (creator_id = auth.uid());

-- ============ GROUP MEMBERS POLICIES ============
DROP POLICY IF EXISTS "group_members_select_all" ON group_members;
CREATE POLICY "group_members_select_all"
ON group_members FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "group_members_insert_own" ON group_members;
CREATE POLICY "group_members_insert_own"
ON group_members FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "group_members_delete_admin_or_self" ON group_members;
CREATE POLICY "group_members_delete_admin_or_self"
ON group_members FOR DELETE
TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);

-- ============ CONVERSATIONS POLICIES ============
DROP POLICY IF EXISTS "conversations_select_member" ON conversations;
CREATE POLICY "conversations_select_member"
ON conversations FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
CREATE POLICY "conversations_insert_own"
ON conversations FOR INSERT
TO authenticated WITH CHECK (true);

-- ============ CONVERSATION MEMBERS POLICIES ============
DROP POLICY IF EXISTS "conversation_members_select_member" ON conversation_members;
CREATE POLICY "conversation_members_select_member"
ON conversation_members FOR SELECT
TO authenticated USING (
  conversation_id IN (
    SELECT cm2.conversation_id FROM conversation_members cm2 WHERE cm2.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "conversation_members_insert_own" ON conversation_members;
CREATE POLICY "conversation_members_insert_own"
ON conversation_members FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ MESSAGES POLICIES ============
DROP POLICY IF EXISTS "messages_select_member" ON messages;
CREATE POLICY "messages_select_member"
ON messages FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own"
ON messages FOR INSERT
TO authenticated WITH CHECK (sender_id = auth.uid());

-- ============ NOTIFICATIONS POLICIES ============
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_actor" ON notifications;
CREATE POLICY "notifications_insert_actor"
ON notifications FOR INSERT
TO authenticated WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own"
ON notifications FOR DELETE
TO authenticated USING (user_id = auth.uid());

-- ============ STORIES POLICIES ============
DROP POLICY IF EXISTS "stories_select_recent" ON stories;
CREATE POLICY "stories_select_recent"
ON stories FOR SELECT
TO authenticated USING (created_at > now() - interval '24 hours');

DROP POLICY IF EXISTS "stories_insert_own" ON stories;
CREATE POLICY "stories_insert_own"
ON stories FOR INSERT
TO authenticated WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "stories_delete_own" ON stories;
CREATE POLICY "stories_delete_own"
ON stories FOR DELETE
TO authenticated USING (author_id = auth.uid());

-- ============ STORY VIEWS POLICIES ============
DROP POLICY IF EXISTS "story_views_select_own_or_author" ON story_views;
CREATE POLICY "story_views_select_own_or_author"
ON story_views FOR SELECT
TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM stories s WHERE s.id = story_views.story_id AND s.author_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "story_views_insert_own" ON story_views;
CREATE POLICY "story_views_insert_own"
ON story_views FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ SAVED POSTS POLICIES ============
DROP POLICY IF EXISTS "saved_posts_select_own" ON saved_posts;
CREATE POLICY "saved_posts_select_own"
ON saved_posts FOR SELECT
TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_posts_insert_own" ON saved_posts;
CREATE POLICY "saved_posts_insert_own"
ON saved_posts FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_posts_delete_own" ON saved_posts;
CREATE POLICY "saved_posts_delete_own"
ON saved_posts FOR DELETE
TO authenticated USING (user_id = auth.uid());

-- ============ UPDATED posts SELECT policy to honor friends visibility ============
DROP POLICY IF EXISTS "posts_select_visible" ON posts;
CREATE POLICY "posts_select_visible"
ON posts FOR SELECT
TO authenticated USING (
  author_id = auth.uid()
  OR visibility = 'public'
  OR (visibility = 'friends' AND public.are_friends(author_id, auth.uid()))
);
