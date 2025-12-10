import {Room} from "@/lib/supabase/schema";
import {createClient} from "../../lib/supabase/server";
import Link from "next/link";

export default async function RoomsPage() {
  const supabase = await createClient();
  const {data: rooms, error} = await supabase.from("rooms").select("*");

  if (error) {
    return <div>방 목록을 불러올 수 없습니다: {error.message}</div>;
  }

  return (
    <div>
      <h1>방 목록</h1>
      <ul>
        {rooms && rooms.length > 0 ? (
          rooms.map((room: Room) => (
            <li key={room.id}>
              <Link href={`/room/${room.code}`}>{room.code}</Link>
            </li>
          ))
        ) : (
          <li>방이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
