'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// ── Outside component — never recreated ──
const CREDENTIALS = [
  { role: 'Admin',     email: 'admin@quantumguard.com',     pass: 'Admin@123',     color: '#7c3aed' },
  { role: 'Validator', email: 'validator@quantumguard.com', pass: 'Validator@123', color: '#d97706' },
  { role: 'Farmer',    email: 'farmer@quantumguard.com',    pass: 'Farmer@123',    color: '#16a34a' },
];

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Nunito', sans-serif; background: #0f1a12; color: #e8f5e9; }
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .login-box { width: 100%; max-width: 400px; background: #1a2b1c; border: 1px solid #2d4a30; border-radius: 16px; padding: 32px; }
  .login-title { font-size: 22px; font-weight: 800; color: #f0fdf4; margin-bottom: 4px; font-family: 'Poppins', sans-serif; }
  .login-sub { font-size: 13px; color: #6b7280; margin-bottom: 28px; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .field input { width: 100%; height: 46px; background: #111b13; border: 1.5px solid #2d4a30; border-radius: 9px; padding: 0 42px 0 13px; font-size: 14px; color: #e8f5e9; outline: none; transition: border-color .2s; font-family: 'Nunito', sans-serif; }
  .field input:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.08); background: #1e3520; }
  .field input::placeholder { color: #374151; }
  .pass-wrap { position: relative; }
  .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; color: #6b7280; padding: 0; line-height: 1; }
  .submit-btn { width: 100%; height: 48px; border-radius: 10px; border: none; background: linear-gradient(135deg,#22c55e,#16a34a); color: white; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; font-family: 'Nunito', sans-serif; transition: .2s; }
  .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,.3); }
  .submit-btn:disabled { opacity: .5; cursor: not-allowed; }
  .quick-label { font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: .07em; text-align: center; margin: 20px 0 10px; }
  .quick-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 20px; }
  .quick-btn { background: #111b13; border: 1.5px solid #2d4a30; border-radius: 10px; padding: 10px 8px; cursor: pointer; text-align: center; transition: .15s; font-family: 'Nunito', sans-serif; }
  .quick-btn:hover { border-color: #4ade80; background: #1e3520; }
  .quick-role { font-size: 11px; font-weight: 700; margin-bottom: 2px; }
  .quick-email { font-size: 9px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .register-link { text-align: center; font-size: 13px; color: #4b5563; }
  .register-link a { color: #4ade80; font-weight: 700; text-decoration: none; }
`;

export default function LoginPage() {
  const router = useRouter();
  const sb = createClient();
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef  = useRef<HTMLInputElement>(null);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Stable toggle — won't recreate on render ──
  const togglePass = useCallback(() => setShowPass(p => !p), []);

  // ── Quick fill — stable callback ──
  const fillCreds = useCallback((email: string, pass: string) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passRef.current)  passRef.current.value  = pass;
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const email    = emailRef.current?.value.trim() || '';
    const password = passRef.current?.value || '';
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: ud } = await sb.from('users').select('role').eq('id', data.user.id).single();
      const role = (ud as any)?.role || 'farmer';
      toast.success('Welcome back!');
      router.push(`/dashboard/${role}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (<>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />

    <div className="login-wrap">
      <div className="login-box">
        <div className="login-title">🌾 Sign In</div>
        <div className="login-sub">Access your QuantumGuard dashboard</div>

        <form onSubmit={handleLogin} noValidate>
          <div className="field">
            <label>Email Address</label>
            <input ref={emailRef} type="email" placeholder="your@email.com"
              autoComplete="email" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="pass-wrap">
              <input ref={passRef} type={showPass ? 'text' : 'password'}
                placeholder="Enter password" autoComplete="current-password" />
              <button type="button" className="eye-btn" onClick={togglePass}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🌾 Sign In to Dashboard'}
          </button>
        </form>

        {/* Quick login */}
        <div className="quick-label">Quick Login</div>
        <div className="quick-grid">
          {CREDENTIALS.map(c => (
            <button key={c.role} className="quick-btn"
              onClick={() => fillCreds(c.email, c.pass)}>
              <div className="quick-role" style={{ color: c.color }}>{c.role}</div>
              <div className="quick-email">{c.email}</div>
            </button>
          ))}
        </div>

        <div className="register-link">
          New farmer? <a href="/auth/register">Register here →</a>
        </div>
      </div>
    </div>
  </>);
}
