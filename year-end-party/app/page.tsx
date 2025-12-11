"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import "./LoginPage.css";
import {createClient} from "@/lib/supabase/client";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!nickname.trim()) {
      alert("팀명을 입력해주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const nicknameTrimmed = nickname.trim();

    /** ----------------------------------------------------------
     * 1. users 테이블에서 nickname 존재 여부 조회
     * ---------------------------------------------------------- */
    const {data: existingUsers, error: selectError} = await supabase
      .from("users")
      .select("*")
      .eq("nickname", nicknameTrimmed)
      .limit(1);

    if (selectError) {
      alert("유저 조회 실패: " + selectError.message);
      setLoading(false);
      return;
    }

    const localUser = existingUsers?.[0] ?? null;

    let userId: string;
    let email: string;
    let password: string;

    if (localUser) {
      /** ----------------------------------------------------------
       * 2-A. 이미 nickname으로 users row가 있다면
       *      해당 user.id 기반으로 Auth.User 로그인 시도
       * ---------------------------------------------------------- */
      userId = localUser.id;
      email = `${userId}@local-user.dev`;
      password = userId;

      // 로그인 테스트
      const {error: loginError} = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        // Auth.User가 없을 가능성 → 새로 만든다
        const {error: signupError} = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupError) {
          alert("로그인 실패: " + signupError.message);
          setLoading(false);
          return;
        }

        // 다시 로그인
        await supabase.auth.signInWithPassword({email, password});
      }
    } else {
      /** ----------------------------------------------------------
       * 2-B. nickname이 users 테이블에 없는 경우 → 신규 가입
       * ---------------------------------------------------------- */
      userId = crypto.randomUUID();
      email = `${userId}@local-user.dev`;
      password = userId;

      /** 1) Auth.User 생성 */
      const {data: signUpData, error: signupError} = await supabase.auth.signUp(
        {
          email,
          password,
        }
      );

      if (signupError || !signUpData?.user) {
        alert("회원가입 실패: " + signupError?.message);
        setLoading(false);
        return;
      }

      /** 2) users 테이블에 로컬 유저 생성 */
      const {error: insertError} = await supabase.from("users").insert({
        id: userId,
        nickname: nicknameTrimmed,
        is_admin: false,
      });

      if (insertError) {
        alert("Users 테이블 생성 실패: " + insertError.message);
        setLoading(false);
        return;
      }

      /** 3) 로그인 */
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    /** ----------------------------------------------------------
     * 3. 로그인 성공 → 방 목록으로 이동
     * ---------------------------------------------------------- */
    router.push("/rooms");
    setLoading(false);
  };

  return (
    <div className="login-container">
      <h1>HR데브옵스팀</h1> 
      <h1>2025 송년회에 오신 것을 환영합니다!</h1>
      <h1>연말 경매 게임</h1>

      <input
        type="text"
        placeholder="팀명을 입력하세요"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="login-input"
        disabled={loading}
      />

      <button onClick={handleLogin} className="login-button" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </div>
  );
}
