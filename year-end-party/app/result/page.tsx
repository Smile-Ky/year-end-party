'use client';

import { useState, useEffect } from 'react';

interface Product {
    id: number;
    name: string;
    image: string;
  }

export default function ResultPage() {
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [result, setResult] = useState<{
    open: boolean;
    winner: string | null;
    winningBid: number | null;
    product: Product | null;
  }>({
    open: false,
    winner: null,
    winningBid: null,
    product: null,
  });

  // 현재 라운드 가져오기
  const fetchCurrentRound = async () => {
    const response = await fetch('/api/round'); // gameState에서 현재 라운드 가져오기
    if (response.ok) {
      const data = await response.json();
      setCurrentRound(data.currentRound);
    } else {
      alert('현재 라운드를 가져오는 데 실패했습니다.');
    }
  };

  const fetchResult = async (round: number) => {
    const response = await fetch(`/api/result?round=${round}`);
    if (response.ok) {
      const data = await response.json();
      setResult(data);
    } else {
      alert('결과를 가져오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    // 현재 라운드를 가져온 후, 해당 라운드의 결과를 가져옴
    const loadData = async () => {
      await fetchCurrentRound();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (currentRound !== null) {
      fetchResult(currentRound); // 현재 라운드의 결과 가져오기
    }
  }, [currentRound]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>현재 라운드: {currentRound}</h1>
      {result.open ? (
        result.winner && result.product ? (
          <>
            <h2>우승자: {result.winner}</h2>
            <h3>낙찰 포인트: {result.winningBid}</h3>
            <h4>상품: {result.product.name}</h4>
            <img src={result.product.image} alt={result.product.name} style={{ width: '200px' }} />
          </>
        ) : (
          <p>결과를 불러오는 중입니다...</p>
        )
      ) : (
        <p>경매가 진행 중입니다. 결과를 기다려주세요.</p>
      )}
    </div>
  );
}