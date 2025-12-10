'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  image: string;
}

export default function HostPage() {
  const [currentRound, setCurrentRound] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);

  const fetchRoundData = async () => {
    const response = await fetch('/api/round');
    if (response.ok) {
      const data = await response.json();
      setCurrentRound(data.currentRound);
      setProduct(data.product);
    }
  };

  const changeRound = async (action: 'next' | 'previous') => {
    const response = await fetch('/api/round', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (response.ok) {
      const data = await response.json();
      setCurrentRound(data.currentRound);
      setProduct(data.product);
    } else {
      alert('라운드를 변경할 수 없습니다.');
    }
  };

  const openResult = async () => {
    const response = await fetch('/api/result', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: currentRound, open: true }),
    });

    if (response.ok) {
      alert('결과가 공개되었습니다.');
    } else {
      alert('결과 공개에 실패했습니다.');
    }
  };

  const closeResult = async () => {
    const response = await fetch('/api/result', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: currentRound, open: false }),
    });

    if (response.ok) {
      alert('결과를 비공개 처리 하였습니다.');
    } else {
      alert('결과 비공개 처리에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchRoundData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Host Page</h1>
      <h2>현재 라운드: {currentRound}</h2>
      {product && (
        <>
          <h3>상품 이름: {product.name}</h3>
          <img src={product.image} alt={product.name} style={{ width: '200px' }} />
        </>
      )}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => changeRound('previous')} disabled={currentRound === 1}>
          이전 라운드
        </button>
        <button onClick={openResult}>결과 오픈</button>
        <button onClick={closeResult}>결과 닫기</button>
        <button onClick={() => changeRound('next')} style={{ marginLeft: '10px' }}>
          다음 라운드
        </button>
      </div>
    </div>
  );
}