"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Room } from "@/lib/supabase/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./RoomClient.css";

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
            router.push(`/room/${room.code}/auction/1`);
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
    <div className="room-container">
      <h1 className="room-title">{room.name}</h1>
  
      <div>
        <strong
          className="room-status"
          style={{ color: start ? "green" : "gray" }}
        >
          {start
            ? "게임이 시작되었습니다! 아래 버튼을 클릭해 입장해주세요"
            : "잠시만 대기해주세요"}
        </strong>
      </div>
      <br></br>
      {start && (
        <Link href={`/room/${room.code}/auction/1`} className="enter-button">
          입장하기
        </Link>
      )}
    </div>
  );
}
