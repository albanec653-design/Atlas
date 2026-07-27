-- Add video_url column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS video_url text;

-- Add index for video_url for better query performance
CREATE INDEX IF NOT EXISTS posts_video_url_idx ON public.posts(video_url) WHERE video_url IS NOT NULL;
