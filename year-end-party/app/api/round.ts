import { NextApiRequest, NextApiResponse } from 'next';
import { gameState } from './state/gameState';
import { products } from './state/products';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const currentProduct = products[gameState.currentRound - 1];
    return res.status(200).json({
      currentRound: gameState.currentRound,
      product: currentProduct,
    });
  }

  if (req.method === 'PATCH') {
    const { action } = req.body;
    if (action === 'next' && gameState.currentRound < products.length) {
      gameState.currentRound += 1;
    } else if (action === 'previous' && gameState.currentRound > 1) {
      gameState.currentRound -= 1;
    } else {
      return res.status(400).json({ error: 'Invalid action or out of bounds' });
    }

    const currentProduct = products[gameState.currentRound - 1];
    return res.status(200).json({
      currentRound: gameState.currentRound,
      product: currentProduct,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}