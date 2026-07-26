/*
# Atlas Core Schema — Profiles, Posts, Comments, Reactions

1. Overview
This migration establishes the core social-network data model for Atlas (a Facebook-style app).
It creates the foundational tables: profiles (extending auth.users), posts, comments (with
threaded replies), and reactions (Facebook-style emoji reactions). All tables have Row Level
Security enabled with ownership-scoped and visibility-scoped policies.

2. New Tables
- `profiles` — public user profile data linked 1:1 to auth.users.
    - id (uuid, PK, references auth.users)
    - username (text, unique, not null) — handle used in URLs
    - full_name (text, not null) — display name
    - avatar_url (text, nullable) — profile picture URL
    - cover_url (text, nullable) — cover photo URL
    - bio (text, nullable) — short bio
    - location (text, nullable)
    - work (text, nullable)
    - education (text, nullable)
    - birth_date (date, nullable)
    - phone (text, nullable)
    - website (text, nullable)
    - created_at (timestamptz, default now())
- `posts` — user-authored feed posts.
    - id (uuid, PK)
    - author_id (uuid, not null, default auth.uid(), references profiles)
    - content (text, nullable)
    - image_url (text, nullable)
    - background_color (text, nullable) — colored background for text posts
    - visibility (text, not null, default 'public') — public | friends | private
    - group_id (uuid, nullable, references groups)
    - created_at (timestamptz, default now())
- `comments` — comments and threaded replies on posts.
    - id (uuid, PK)
    - post_id (uuid, not null, references posts, cascade delete)
    - author_id (uuid, not null, default auth.uid(), references profiles)
    - content (text, not null)
    - image_url (text, nullable)
    - parent_id (uuid, nullable, references comments) — for replies
    - created_at (timestamptz, default now())
- `reactions` — emoji reactions on posts (like, love, haha, wow, sad, angry).
    - id (uuid, PK)
    - post_id (uuid, not null, references posts, cascade delete)
    - user_id (uuid, not null, default auth.uid(), references profiles)
    - type (text, not null) — like | love | haha | wow | sad | angry
    - created_at (timestamptz, default now())
    - UNIQUE (post_id, user_id) — one reaction per user per post

3. Security (RLS)
- profiles: authenticated can SELECT any profile (social network is public). Only owner can UPDATE/DELETE.
- posts: authenticated can SELECT public posts and own posts. Owner can INSERT/UPDATE/DELETE own posts.
- comments: authenticated can SELECT comments on posts they can see. Owner can INSERT/UPDATE/DELETE own comments.
- reactions: authenticated can SELECT all reactions. Owner can INSERT/DELETE own reactions (no update; toggle instead).

4. Notes
- owner columns default to auth.uid() so client inserts omitting the owner still pass RLS.
- visibility 'public' is readable by all authenticated users; 'friends' is readable by author + accepted friends (enforced in a later migration once friendships exist; for now public + own).
- All policies use auth.uid(); never current_user.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  cover_url text,
  bio text,
  location text,
  work text,
  education text,
  birth_date date,
  phone text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
TO authenticated USING (auth.uid() = id);

-- ============ POSTS ============
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  image_url text,
  background_color text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','friends','private')),
  group_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_visible" ON posts;
CREATE POLICY "posts_select_visible"
ON posts FOR SELECT
TO authenticated USING (
  author_id = auth.uid()
  OR visibility = 'public'
  OR visibility = 'friends'
);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own"
ON posts FOR INSERT
TO authenticated WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own"
ON posts FOR UPDATE
TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own"
ON posts FOR DELETE
TO authenticated USING (author_id = auth.uid());

-- ============ COMMENTS ============
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_visible" ON comments;
CREATE POLICY "comments_select_visible"
ON comments FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own"
ON comments FOR INSERT
TO authenticated WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own"
ON comments FOR UPDATE
TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own"
ON comments FOR DELETE
TO authenticated USING (author_id = auth.uid());

-- ============ REACTIONS ============
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like','love','haha','wow','sad','angry')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_all" ON reactions;
CREATE POLICY "reactions_select_all"
ON reactions FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "reactions_insert_own" ON reactions;
CREATE POLICY "reactions_insert_own"
ON reactions FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reactions_delete_own" ON reactions;
CREATE POLICY "reactions_delete_own"
ON reactions FOR DELETE
TO authenticated USING (user_id = auth.uid());

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
