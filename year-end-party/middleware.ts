// middleware.ts (Next.js App Router 기반)
import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({name, value, options}) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 예: 세션 갱신
  await supabase.auth.getUser();

  return response;
}

// 필요한 경로 매칭 설정
export const config = {
  matcher: [
    // 예: 로그인 이후 사용자가 보는 모든 경로
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
