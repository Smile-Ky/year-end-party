// Supabase 테이블 스키마 타입 일괄 관리

export type Room = {
  id: string;
  code: string;
  host_id: string;
  total_rounds: number;
  current_round: number | null;
  initial_points: number;
  created_at: string | null;
};

export type Player = {
  id: string;
  room_id: string | null;
  points: number;
  joined_at: string | null;
  user_id: string | null;
};
