'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './LoginPage.css';

export default function LoginPage() {
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (!nickname.trim()) {
      alert('팀명을 입력해주세요.');
      return;
    }

    localStorage.setItem('nickname', nickname.trim());

    router.push('/auction');
  };

  return (
    <div className="login-container">
      <h1>Hr데브옵스팀 송년회에 오신 것을 환영합니다!</h1>
      <h1>연말 경매 게임</h1>
      <input
        type="text"
        placeholder="팀명을 입력하세요"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="login-input"
      />
      <button onClick={handleLogin} className="login-button">
        로그인
      </button>
    </div>
  );
}