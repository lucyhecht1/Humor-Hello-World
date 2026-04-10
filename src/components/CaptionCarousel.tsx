// Type re-exported for shared use across deck components
export type CarouselPost = {
  id: string;
  content: string;
  created_datetime_utc: string;
  image_id: string | null;
  vote_count: number;
  user_vote: number | null;
  imageUrl: string | null;
  username: string;
  gradient: string;
};
