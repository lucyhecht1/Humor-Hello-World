export type Caption = {
  id: string;
  content: string;
  created_datetime_utc: string;
  image_id: string | null;
};

export type CaptionWithVotes = Caption & {
  vote_count: number;
  user_vote: number | null;
};
