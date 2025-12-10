import { NextApiRequest, NextApiResponse } from 'next';
import { results } from './state/results';
import { bids } from './state/bids';
import { products } from './state/products';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { round } = req.query;
    const roundNumber = parseInt(round as string);

    if (!results[roundNumber]) {
      return res.status(404).json({ error: '해당 라운드의 결과가 없습니다.' });
    }

    return res.status(200).json(results[roundNumber]);
  }

  if (req.method === 'PATCH') {
    const { round, open } = req.body;
    const roundNumber = parseInt(round, 10);

    if (open) {
      const roundBids = bids.filter((bid) => bid.round === roundNumber);

      if (roundBids.length === 0) {
        return res.status(400).json({ error: '해당 라운드에 입찰 정보가 없습니다.' });
      }

      const highestBid = roundBids.reduce(
        (max, bid) => (bid.bidAmount > max.bidAmount ? bid : max),
        { round: roundNumber, bidAmount: 0, nickname: '' } // 초기값 수정
      );

      results[roundNumber] = {
        open: true,
        winner: highestBid.nickname,
        winningBid: highestBid.bidAmount,
        product: products[roundNumber - 1],
      };
    } else {
      if (!results[roundNumber]) {
        results[roundNumber] = {
          open: false,
          winner: null,
          winningBid: null,
          product: products[roundNumber - 1],
        };
      } else {
        results[roundNumber].open = false;
      }
    }

    return res.status(200).json(results[roundNumber]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}