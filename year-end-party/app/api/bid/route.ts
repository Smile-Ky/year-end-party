import { NextRequest, NextResponse } from 'next/server';
import { bids } from '../state/bids';

const INITIAL_POTINS = 300;

function getUserTotalBids(nickname: string): number {
  return bids
    .filter((bid) => bid.nickname === nickname)
    .reduce((total, bid) => total + bid.bidAmount, 0);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { round, nickname, bidAmount } = body;

    if (!round || !nickname || bidAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bid data' }, { status: 400 });
    }

    const existingBid = bids.find((bid) => bid.round === round && bid.nickname === nickname);
    if (existingBid) {
      return NextResponse.json({ error: 'You have already placed a bid for this round.' }, { status: 400 });
    }

    const totalBids = getUserTotalBids(nickname);
    if (totalBids + bidAmount > INITIAL_POTINS) {
      return NextResponse.json({ error: 'Insufficient points for this bid.' }, { status: 400 });
    }

    bids.push({ round, nickname, bidAmount });
    return NextResponse.json({ message: 'Bid registered' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}}