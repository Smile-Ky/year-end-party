import { NextRequest, NextResponse } from 'next/server';
import { gameState } from '../state/gameState';
import { products } from '../state/products';

export async function GET() {
  const currentProduct = products[gameState.currentRound - 1];
  return NextResponse.json({
    currentRound: gameState.currentRound,
    product: currentProduct,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'next' && gameState.currentRound < products.length) {
      gameState.currentRound += 1;
    } else if (action === 'previous' && gameState.currentRound > 1) {
      gameState.currentRound -= 1;
    } else {
      return NextResponse.json({ error: 'Invalid action or out of bounds' }, { status: 400 });
    }
    const currentProduct = products[gameState.currentRound - 1];
    return NextResponse.json({
      currentRound: gameState.currentRound,
      product: currentProduct,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}