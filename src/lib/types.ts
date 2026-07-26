export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
  work: string | null;
  education: string | null;
  birth_date: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  content: string | null;
  image_url: string | null;
  background_color: string | null;
  visibility: 'public' | 'friends' | 'private';
  group_id: string | null;
  created_at: string;
  author?: Profile;
  reactions?: Reaction[];
  comments?: Comment[];
  reaction_counts?: Record<ReactionType, number>;
  viewer_reaction?: ReactionType | null;
  is_saved?: boolean;
};

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  parent_id: string | null;
  created_at: string;
  author?: Profile;
  replies?: Comment[];
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  addressee?: Profile;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  category_id: string | null;
  privacy: 'public' | 'private';
  creator_id: string;
  created_at: string;
  creator?: Profile;
  member_count?: number;
  is_member?: boolean;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
};

export type Conversation = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  members?: Profile[];
  last_message?: Message;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  sender?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'like' | 'comment' | 'friend_request' | 'friend_accept' | 'message' | 'group_invite' | 'tag' | 'reaction';
  entity_id: string | null;
  entity_type: string | null;
  content: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
};

export type Story = {
  id: string;
  author_id: string;
  image_url: string | null;
  content: string | null;
  background_color: string | null;
  created_at: string;
  author?: Profile;
  views?: StoryView[];
  has_viewed?: boolean;
};

export type StoryView = {
  id: string;
  story_id: string;
  user_id: string;
  viewed_at: string;
};

export type SavedPost = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type Page =
  | { name: 'home' }
  | { name: 'profile'; userId: string }
  | { name: 'friends' }
  | { name: 'messages' }
  | { name: 'notifications' }
  | { name: 'groups' }
  | { name: 'group'; groupId: string }
  | { name: 'saved' }
  | { name: 'explore' }
  | { name: 'marketplace' };
