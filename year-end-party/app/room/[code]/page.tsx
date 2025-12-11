import {createClient} from "@/lib/supabase/server";
import RoomClient from "./RoomClient";

export default async function RoomPage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const roomCode = resolvedParams.code;

  // 방 정보 조회
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single();

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

  if (!room) {
    return <div>방을 찾을 수 없습니다.</div>;
  }

  return <RoomClient room={room} />;
}
