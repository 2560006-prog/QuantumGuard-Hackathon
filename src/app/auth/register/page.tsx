'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const sb = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ----------- REFS (NO STATE) ----------- */
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const mobileRef = useRef<HTMLInputElement>(null);
  const aadhaarRef = useRef<HTMLInputElement>(null);

  const landRef = useRef<HTMLInputElement>(null);

  /* ----------- NEXT STEP ----------- */
  function nextStep() {
    const name = nameRef.current?.value || '';
    const email = emailRef.current?.value || '';
    const pass = passRef.current?.value || '';
    const confirm = confirmRef.current?.value || '';

    const mobile = mobileRef.current?.value || '';

    if (step === 1) {
      if (!name || !email || !pass) {
        toast.error('Fill all fields');
        return;
      }
      if (pass !== confirm) {
        toast.error('Passwords do not match');
        return;
      }
    }

    if (step === 2) {
      if (mobile.length !== 10) {
        toast.error('Invalid mobile');
        return;
      }
    }

    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  }

  /* ----------- SUBMIT ----------- */
  async function submit() {
    setLoading(true);

    try {
      const email = emailRef.current?.value || '';
      const password = passRef.current?.value || '';

      const { error } = await sb.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Registered successfully!');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ----------- UI ----------- */
  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2>Register - Step {step}</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input ref={nameRef} placeholder="Full Name" style={styles.input} />
            <input ref={emailRef} placeholder="Email" style={styles.input} />
            <input ref={passRef} type="password" placeholder="Password" style={styles.input} />
            <input ref={confirmRef} type="password" placeholder="Confirm Password" style={styles.input} />
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input ref={mobileRef} placeholder="Mobile Number" style={styles.input} />
            <input ref={aadhaarRef} placeholder="Aadhaar" style={styles.input} />
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <input ref={landRef} placeholder="Land Area" style={styles.input} />
          </>
        )}

        <button onClick={nextStep} disabled={loading} style={styles.btn}>
          {loading ? 'Processing...' : step === 3 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}

/* ----------- STYLES ----------- */
const styles: any = {
  page: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0f1a12',
    color: 'white',
  },
  box: {
    width: '350px',
    padding: '25px',
    background: '#1a2b1c',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    height: '40px',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #2d4a30',
  },
  btn: {
    height: '40px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
