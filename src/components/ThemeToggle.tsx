'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qg-theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('qg-theme', next ? 'dark' : 'light');
  }

  return (
    <button onClick={toggle} title={dark ? 'Light Mode' : 'Dark Mode'} style={{
      position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999,
      width: '44px', height: '44px', borderRadius: '50%',
      background: dark ? '#1e3520' : 'white',
      border: '2px solid #4CAF50', cursor: 'pointer',
      fontSize: '20px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.2)',
      transition: '.2s',
    }}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
}