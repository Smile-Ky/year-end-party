// Supabase 테이블 스키마 타입 일괄 관리

export type Room = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  total_rounds: number;
  start: boolean;
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

export type Bid ={
  id: string;
  round_id: string | null;
  player_id: string | null;
  bid_points: number;
  created_at: string | null;
}