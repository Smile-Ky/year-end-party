export interface Result {
  open: boolean;
  winner: string | null;
  winningBid: number | null;
  product: { name: string; image: string } | null;
}

export const results: { [round: number]: Result } = {};