'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
    id: number;
    name: string;
    image: string;
  }

export default function AuctionPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState(() => localStorage.getItem('nickname') || '');
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem('points') || '0'));
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  
  const fetchRoundData = async () => {
    const response = await fetch('/api/round');
    if (response.ok) {
      const data = await response.json();
      setCurrentRound(data.currentRound);
      setProduct(data.product);
    }
  };

  useEffect(() => {
    fetchRoundData();
  }, []);

  const handleBid = async () => {
    if (bidAmount <= 0 || bidAmount > points) {
      alert('유효한 포인트를 입력하세요.');
      return;
    }

    const response = await fetch('/api/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, bidAmount, round: currentRound }),
    });

    if (response.ok) {
      const newPoints = points - bidAmount;
      setPoints(newPoints);
      localStorage.setItem('points', newPoints.toString());
      router.push('/result');
    } else {
      alert('경매 등록에 실패했습니다.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Round {currentRound}</h1>
      {product && (
        <>
          <h2>{product.name}</h2>
          <img src={product.image} alt={product.name} style={{ width: '200px' }} />
        </>
      )}
      <p>잔여 포인트: {points}</p>
      <input
        type="number"
        value={bidAmount}
        onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
        placeholder="포인트 입력"
      />
      <button onClick={handleBid}>경매 등록</button>
    </div>
  );
}