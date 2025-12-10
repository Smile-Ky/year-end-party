import { NextRequest, NextResponse } from 'next/server';
import { results } from '../state/results';
import { bids } from '../state/bids';
import { products } from '../state/products';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const round = searchParams.get('round');
  var roundNumber = round ? parseInt(round, 10) : null;

  if (roundNumber === null || !results[roundNumber]) {
    if (roundNumber == null) {
      roundNumber = 1;
    }
    return NextResponse.json({
      open: false,
      winner: null,
      winningBid: null,
      product: products[roundNumber - 1],
    });
  }
  return NextResponse.json(results[roundNumber]);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { round, open } = body;
    const roundNumber = parseInt(round, 10);

    if (!roundNumber || roundNumber<1) {
      return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
    }

    if (open) {
      const roundBids = bids.filter((bid) => bid.round === roundNumber);

      if (roundBids.length === 0) {
        return NextResponse.json({ error: 'No bids for this round' }, { status: 400 });
      }

      const highestBid = roundBids.reduce((max, bid) => (bid.bidAmount > max.bidAmount ? bid : max), roundBids[0]);

      results[roundNumber] = {
        open : true,
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
    return NextResponse.json({ message: 'Result updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}