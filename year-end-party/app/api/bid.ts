import { NextApiRequest, NextApiResponse } from 'next';
import { bids } from './state/bids';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { round, nickname, bidAmount } = req.body;

    if (!round || !nickname || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bid data' });
    }

    const existingBid = bids.find((bid) => bid.round === round && bid.nickname === nickname);
    if (existingBid) {
      return res.status(400).json({ error: 'You have already placed a bid for this round.' });
    }

    bids.push({ round, nickname, bidAmount });
    return res.status(200).json({ message: 'Bid registered' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}