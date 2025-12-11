import {Room} from "@/lib/supabase/schema";
import {createClient} from "@/lib/supabase/server";
import Link from "next/link";
import "./Rooms.css";

export default async function RoomsPage() {
  const supabase = await createClient();
  const {data: rooms, error} = await supabase.from("rooms").select("*");


  if (error) {
    return <div>방 목록을 불러올 수 없습니다: {error.message}</div>;
  }


  return (
    <div className="rooms-container">
      <ul className="room-list">
        {rooms && rooms.length > 0 ? (
          rooms.map((room: Room) => (
            <li key={room.id} className="room-card">
              <Link href={`/room/${room.code}`} className="room-link">
                {room.name}
              </Link>
            </li>
          ))
        ) : (
          <li className="room-card">방이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
