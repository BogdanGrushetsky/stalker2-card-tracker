'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, clearAuth } from '@/lib/auth';

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const user = getUser();
    if (user) setDisplayName(user.displayName);
  }, []);

  const logout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-hazard">☢</div>
        <h1 className="header-title">S.T.A.L.K.E.R. 2 — Колекційні Карти</h1>
        <div className="header-subtitle">ЗОНА ВІДЧУЖЕННЯ · ATB · 2026 · 48 КАРТ</div>
      </div>

      <div className="header-bottom">
        <nav className="header-nav">
          <Link href="/"
            className={`nav-link${pathname === '/' ? ' active' : ''}`}>
            Колекція
          </Link>
          <Link href="/friends"
            className={`nav-link${pathname === '/friends' ? ' active' : ''}`}>
            Друзі
          </Link>
        </nav>
        {displayName && (
          <div className="header-user">
            <span className="header-username">{displayName}</span>
            <button className="btn-logout" onClick={logout}>Вихід</button>
          </div>
        )}
      </div>
    </header>
  );
}
