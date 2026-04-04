'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const email = emailRef.current?.value || '';
    const password = passRef.current?.value || '';

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = (userData as any)?.role || 'farmer';

      toast.success('Welcome back!');
      router.push(`/dashboard/${role}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2 style={styles.title}>Login</h2>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={styles.field}>
            <label>Email</label>
            <input
              type="email"
              ref={emailRef}
              placeholder="Enter email"
              style={styles.input}
              required
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                ref={passRef}
                placeholder="Enter password"
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eye}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Button */}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* Quick fill */}
        <div style={styles.quick}>
          <button
            onClick={() => {
              if (emailRef.current) emailRef.current.value = 'admin@quantumguard.com';
              if (passRef.current) passRef.current.value = 'Admin@123';
            }}
          >
            Fill Admin
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: any = {
  page: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0f1a12',
    color: 'white',
    fontFamily: 'sans-serif',
  },
  box: {
    width: '350px',
    padding: '30px',
    borderRadius: '10px',
    background: '#1a2b1c',
  },
  title: {
    marginBottom: '20px',
  },
  field: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    height: '40px',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #2d4a30',
    outline: 'none',
    marginTop: '5px',
  },
  eye: {
    position: 'absolute',
    right: '10px',
    top: '8px',
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
  },
  button: {
    width: '100%',
    height: '40px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '6px',
    marginTop: '10px',
    cursor: 'pointer',
  },
  quick: {
    marginTop: '15px',
    textAlign: 'center',
  },
};
