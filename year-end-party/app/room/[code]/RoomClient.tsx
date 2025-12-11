"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Room } from "@/lib/supabase/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RoomClient({ room }:{room:Room}) {
  const supabase = createClient();
  const [start, setStart] = useState(room.start);
  const router = useRouter();

  useEffect(() => {
    // --- Realtime 구독 ---
    const channel = supabase
      .channel(`room-start-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const newStart = payload.new.start;
          setStart(newStart);

          console.log("start 변경 감지:", newStart);

          // start가 true가 되면 다음 단계 실행
          if (newStart) {
            router.push(`/room/${room.code}/auction`);
            alert("게임이 시작되었습니다!");
            // TODO: 라운드 이동, 화면 전환 등의 로직
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, supabase]);

  return (
    <div>
      <h1>{room.name}</h1>

      <div>
        <strong style={{ color: start ? "green" : "gray" }}>
          {start ? "게임이 시작되었습니다! 아래 버튼을 클릭해 입장해주세요" : "잠시만 대기해주세요"}
        </strong>
      </div>

      {start && (<Link href={`/room/${room.code}/auction`}>입장하기</Link>)}

      {/* 관리자만 눌러서 start 변경 가능
      <button
        onClick={async () => {
          await supabase
            .from("rooms")
            .update({ start: true })
            .eq("id", room.id);
        }}
      >
        Start Game
      </button> */}
    </div>
  );
}
