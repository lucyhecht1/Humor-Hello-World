-- Database Schema for Caption Voting System
-- 
-- This file documents the expected database schema.
-- You can run these SQL commands in Supabase SQL Editor to create the tables.
--
-- To access Supabase SQL Editor:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Create a new query and paste these commands

-- ============================================
-- CAPTIONS TABLE
-- ============================================
-- This table stores the captions that users can vote on.
-- Note: This table may already exist in your database.
CREATE TABLE IF NOT EXISTS captions (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAPTION_VOTES TABLE
-- ============================================
-- This table stores individual votes from users on captions.
-- Each row represents one user's vote on one caption.
CREATE TABLE IF NOT EXISTS caption_votes (
  id BIGSERIAL PRIMARY KEY,
  caption_id BIGINT NOT NULL REFERENCES captions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)), -- 1 = upvote, -1 = downvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can only have one vote per caption
  UNIQUE(caption_id, user_id)
);

-- ============================================
-- INDEXES (for better query performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_caption_votes_caption_id ON caption_votes(caption_id);
CREATE INDEX IF NOT EXISTS idx_caption_votes_user_id ON caption_votes(user_id);

-- ============================================
-- NOTES:
-- ============================================
-- 1. The caption_votes table uses:
--    - caption_id: Links to which caption is being voted on
--    - user_id: Links to the authenticated user (from auth.users)
--    - vote_type: 1 for upvote, -1 for downvote
--    - UNIQUE constraint: Prevents duplicate votes (one user, one vote per caption)
--
-- 2. The auth.users table is automatically created by Supabase
--    when you enable authentication. It stores user accounts.
--
-- 3. RLS (Row Level Security) policies are NOT modified in this file
--    as per assignment requirements. Make sure your RLS policies
--    allow authenticated users to INSERT, SELECT, UPDATE, DELETE
--    their own votes.
