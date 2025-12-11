'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bid } from '@/lib/supabase/schema';
import "./Result.css";

interface Product {
  name: string;
  image: string;
}

function getWinningBid(bids: Bid[]) {
  // 1. bid_points 등장 횟수 세기
  const countMap = new Map<number, number>();

  for (const bid of bids) {
    countMap.set(bid.bid_points, (countMap.get(bid.bid_points) || 0) + 1);
  }

  // 2. 중복되지 않은 값만 필터
  const uniquePoints = [...countMap.entries()]
    .filter(([point, count]) => count === 1)
    .map(([point]) => point);

  if (uniquePoints.length === 0) {
    return null; // 승자가 없음
  }

  // 3. 중복되지 않은 값 중 최고값 찾기
  const winningPoint = Math.max(...uniquePoints);

  // 4. 해당 점수를 낸 참가자 반환
  return bids.find(b => b.bid_points === winningPoint);
}


export default function ResultPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;

  const [myBid, setMyBid] = useState<Bid|null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [totalRound, setTotalRound] = useState<number | null>(null);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [buttonDisabled, setButtonDisabled] = useState(true);

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

  /** -------------------------------------------------------
   * 🔹 1) 현재 라운드 가져오기
   * ------------------------------------------------------- */
  const loadCurrentRound = async () => {
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
    setRoomId(roomData.id);
    setTotalRound(roomData.total_rounds);

    const { data: playerData, error: playerError} = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('user_id', userRow.id)
      .single();

    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('round_number', roomData.current_round)
      .order('round_number', { ascending: true })
      .single();

    if (error) return;

    const round = data;

    setCurrentRound(round.round_number);
    setCurrentRoundId(round.id);

    const {data:myBidData, error:myBidError} = await supabase
      .from('bids')
      .select('*')
      .eq('round_id', round.id)
      .eq('player_id', playerData.id)
      .single()
    
    if(myBidData){
      setMyBid(myBidData)
    }
  };

  /** -------------------------------------------------------
   * 🔹 2) 라운드 오픈 여부 + 상품 + 우승자 조회
   * ------------------------------------------------------- */
  const loadResult = async (roundId: string) => {
    // ① 라운드 정보 (open 플래그 + product)
    const { data: round } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    if (!round) return;

    // open = false → 경매 진행 중 (결과 공개 X)
    if (!round.open) {
      setResult({
        open: false,
        winner: null,
        winningBid: null,
        product: {
          name: round.item_name,
          image: round.item_url,
        },
      });
      return;
    }

    // ② 최고 입찰 조회
    const { data: bids } = await supabase
      .from('bids')
      .select('*')
      .eq('round_id', roundId)
      .order('bid_points', { ascending: false })

    if (!bids || bids.length === 0) {
      setResult({
        open: true,
        winner: null,
        winningBid: null,
        product: {
          name: round.item_name,
          image: round.item_url,
        },
      });
      return;
    }

    const winningBid = getWinningBid(bids);

    // ③ 우승자 닉네임 조회
    if (winningBid){
      const { data: playerRow } = await supabase
        .from('players')
        .select('user_id')
        .eq('id', winningBid.player_id)
        .single();

      const { data: userRow } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', playerRow?.user_id)
        .single();

      setResult({
        open: true,
        winner: userRow?.nickname ?? null,
        winningBid: winningBid.bid_points,
        product: {
          name: round.item_name,
          image: round.item_url,
        },
      });
    } else {
      // 승자가 없는 경우
      setResult({
        open: true,
        winner: null,
        winningBid: null,
        product: {
          name: round.item_name,
          image: round.item_url,
        },
      });
    }
  };

  /** -------------------------------------------------------
   * 🔹 3) 라운드 오픈 여부 실시간 감지 (Supabase Realtime)
   * ------------------------------------------------------- */
  const subscribeRound = (roundId: string) => {
    const channel = supabase.channel(`round-${roundId}`).on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rounds',
        filter: `id=eq.${roundId}`,
      },
      (payload) => {
        const newOpen = payload.new.open;
        const roundRow = payload.new;

        // open === false → 경매 중
        if (!newOpen) {
          setResult((prev) => ({
            open: false,
            winner: null,
            winningBid: null,
            product: {
              name: roundRow.item_name,
              image: roundRow.item_url,
            },
          }));
          return;
        }

        // open === true → 결과 표시
        loadResult(roundId);
      }
    );

   channel.subscribe();
  };


  /** load current round */
  useEffect(() => {
    loadCurrentRound();
  }, []);

  /** load result + subscribe when currentRoundId is known */
  useEffect(() => {
    if (currentRoundId) {
      loadResult(currentRoundId);
      subscribeRound(currentRoundId);
    }
  }, [currentRoundId]);

  useEffect(() => {
    console.log(roomId)
    if (roomId) {
      subscribeRoom(roomId);
    }
  }, [roomId]);
  
  const subscribeRoom = async (roomId:string) => {
    if (!roomId) return;
  
    const channel = supabase.channel(`room-${roomId}`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const newRound = payload.new.current_round;
  
        setCurrentRound((prev) => {
          if (prev !== newRound) {
            setButtonDisabled(false);
          }
          return newRound;
        });
      }
    );
  
    await channel.subscribe();
  };

  console.log(currentRound, buttonDisabled)

  const redirectToAuction = () => {
    router.push(`/room/${roomCode}/auction`);
  };

  return (
    <div className="auction-container">
  
      <h1 className="auction-round">현재 라운드: {currentRound}</h1>
      <p className="my-bid">내가 제출한 금액: {myBid?.bid_points}</p>
  
      {result.open ? (
        result.winner && result.product ? (
          <>
            <h2 className="winner-text">우승자: {result.winner}</h2>
            <h4 className="product-name">상품: {result.product.name}</h4>
            <img
              src={result.product.image}
              alt={result.product.name}
              className="product-image"
            />
            {currentRound === totalRound && (
              <button
                disabled={currentRound !== totalRound}
                onClick={()=> router.push(`/rooms`)}
                className="auction-button"
              >
                시작페이지로 이동
              </button>
            )}
          </>
        ) : (
          <p className="info-text">결과를 불러오는 중입니다...</p>
        )
      ) : (
        <p className="info-text">경매가 진행 중입니다. 결과를 기다려주세요.</p>
      )}
  
      {!buttonDisabled && (
        <button
          disabled={buttonDisabled}
          onClick={redirectToAuction}
          className="auction-button"
        >
          경매 페이지로 이동
        </button>
      )}
      
    </div>
  );  
}
