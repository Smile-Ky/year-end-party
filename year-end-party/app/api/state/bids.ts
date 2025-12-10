export interface Bid {
  round: number;
  nickname: string;
  bidAmount: number;
}

export const bids: Bid[] = [];