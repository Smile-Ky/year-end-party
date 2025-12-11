'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import "./Auction.css";

interface Product {
  name: string;
  image: string;
}

export default function AuctionPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;
  const curRound = parseInt(params['cur-round'] as string, 10);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [curRoomRound, setCurRoomRound] = useState<number|null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [bidAmount, setBidAmount] = useState<number|undefined>(undefined);

  /** --------------------------------------------------------------
   * 🔹 1. 세션 → 유저 → players(row) → rounds(row) 가져오기
   * -------------------------------------------------------------- */
  const loadInitialData = async () => {
    // ① Auth User 가져오기
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return; // 로그인 필요 화면 대신 네비게이션 적용 가능
    }

    // ② authUser.email → users.id 추출
    const emailPrefix = authUser.email?.split('@')[0];
    if (!emailPrefix) return;

    const userId = emailPrefix;

    // ③ users 테이블에서 유저 정보 조회
    const { data: userRow } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!userRow) return;

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode)
      .single();
    if (!roomData) return;

    setCurRoomRound(roomData.current_round);
    if (roomData.current_round != curRound) {
      router.push(`/room/${roomCode}/auction/${roomData.current_round}`);
      return;
    }

    // ④ players 테이블에서 현재 방(player) 정보 조회
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userRow.id)
      .eq('room_id', roomData.id)
      .single();

    if (!player) return;

    setPlayerId(player.id);
    setPoints(player.points);

    // ⑤ 현재 라운드 조회 (rounds)

    const { data: roundData, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('round_number', curRound)
      .single();
    if (roundError) return;

    const round = roundData;

    const {data:bidsData, error:bidsError} = await supabase
      .from('bids')
      .select('*')
      .eq('round_id', round.id)
      .eq('player_id', player.id)
      .single();
    
    if(bidsData){
      // 이미 입찰한 경우 결과 페이지로 이동
      router.push(`/room/${roomCode}/result/${curRound}`);
      return;
    }

    setCurrentRoundId(round.id);
    setProduct({
      name: round.item_name,
      image: round.item_url,
    });
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  /** --------------------------------------------------------------
   * 🔹 2. 입찰 제출 (bids insert)
   * -------------------------------------------------------------- */
  const handleBid = async () => {
    if (!playerId || !currentRoundId) return;
    if(bidAmount === undefined) {
      alert("포인트를 입력하세요.");
      return;
    }

    if ( bidAmount < 0 || bidAmount > points) {
      alert('유효한 포인트를 입력하세요.');
      return;
    }

    if (bidAmount % 10 !== 0) {
      alert('포인트는 10의 배수로 입력해야 합니다.');
      return;
    }

    // ① Insert into bids
    const { error } = await supabase.from('bids').insert({
      player_id: playerId,
      round_id: currentRoundId,
      bid_points: bidAmount,
    });

    if (error) {
      console.error(error);
      alert('경매 등록에 실패했습니다.');
      return;
    }

    // ② 포인트 차감 및 players 테이블 업데이트
    const newPoints = points - bidAmount;
    setPoints(newPoints);

    await supabase
      .from('players')
      .update({ points: newPoints })
      .eq('id', playerId);

    router.push(`/room/${roomCode}/result/${curRound}`);
  };

  return (
    <div className="auction-container">
      <h1 className="auction-title">Round {curRound}</h1>
  
      {product && (
        <>
          <h2 className="product-title">{product.name}</h2>
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
          />
        </>
      )}
  
      <p className="remaining-points">잔여 포인트: {points}</p>
      <div>
      <input
        type="number"
        value={bidAmount}
        onChange={(e) => 
          e.target.value === '' ? setBidAmount(undefined) :
          setBidAmount(parseInt(e.target.value)||0)}
        placeholder="포인트 입력"
        className="bid-input"
        step={10}
      />
  
      <button onClick={handleBid} className="bid-button">
        경매 등록
      </button>
      </div>
    </div>
  );  
}
