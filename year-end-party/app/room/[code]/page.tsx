import React from "react";
import {createClient} from "@/lib/supabase/server";
import {Player} from "@/lib/supabase/schema";

interface RoomPageProps {
  params: {code: string};
}

export default async function RoomPage({params}: RoomPageProps) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const roomCode = resolvedParams.code;

  /** ----------------------------------------------------------
   * 1. 현재 Auth User 가져오기
   * ---------------------------------------------------------- */
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return <div>로그인이 필요합니다.</div>;
  }

  /** ----------------------------------------------------------
   * 2. auth.user.email → users.id 추출
   *    example: 1234-uuid@local-user.dev → "1234-uuid"
   * ---------------------------------------------------------- */
  const emailPrefix = authUser.email?.split("@")[0];

  if (!emailPrefix) {
    return <div>Auth 이메일 형식이 올바르지 않습니다.</div>;
  }

  const userId = emailPrefix; // 이것이 users.id

  /** ----------------------------------------------------------
   * 3. users 테이블에서 유저 정보 조회
   * ---------------------------------------------------------- */
  const {data: userRow} = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!userRow) {
    return <div>유효하지 않은 사용자입니다(users row 없음)</div>;
  }

  /** ----------------------------------------------------------
   * 4. 방 정보 조회
   * ---------------------------------------------------------- */
  const {data: roomData} = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single();

  if (!roomData) {
    return <div>해당 코드의 방을 찾을 수 없습니다.</div>;
  }

  /** ----------------------------------------------------------
   * 5. 플레이어 조회하거나 생성
   * ---------------------------------------------------------- */
  const {data: existingPlayers} = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomData.id)
    .eq("user_id", userId)
    .limit(1);

  let player: Player | null = existingPlayers?.[0] ?? null;

  if (!player) {
    const {data: newPlayer} = await supabase
      .from("players")
      .insert({
        room_id: roomData.id,
        user_id: userId,
        points: roomData.initial_points,
      })
      .select()
      .single();

    player = newPlayer ?? null;
  }

  /** ----------------------------------------------------------
   * 6. 참여중인 유저 목록 조회 (닉네임 포함)
   * ---------------------------------------------------------- */
  const {data: playersData} = await supabase
    .from("players")
    .select(
      `
      id,
      points,
      user_id,
      users (
        nickname,
        is_admin
      )
    `
    )
    .eq("room_id", roomData.id);

  const players = playersData ?? [];

  return (
    <div>
      <h1>Room Code: {roomCode}</h1>

      <h2>내 정보</h2>
      <pre>{JSON.stringify(userRow, null, 2)}</pre>

      <h2>내 Player 정보</h2>
      {player ? (
        <pre>{JSON.stringify(player, null, 2)}</pre>
      ) : (
        <div>플레이어 정보를 불러올 수 없습니다.</div>
      )}

      <h2>참여 인원</h2>
      <ul>
        {players.length > 0 ? (
          players.map((p) => {
            const nickname = p.users[0]?.nickname ?? "알 수 없음";
            const isMe = p.user_id === userId;

            return (
              <li key={p.id}>
                {nickname} — {isMe ? `${p.points}점` : "참여 중"}
              </li>
            );
          })
        ) : (
          <li>참여중인 인원이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
