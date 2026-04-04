'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

/* ---------- FIELD COMPONENT (optimized) ---------- */
type FP = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  req?: boolean;
  type?: string;
};

function Field({ label, value, onChange, req, type = 'text' }: FP) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '12px' }}>
        {label} {req && '*'}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        style={styles.input}
      />
    </div>
  );
}

/* ---------- MAIN COMPONENT ---------- */
export default function RegisterPage() {
  const router = useRouter();
  const sb = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    mobile: '',
    aadhaar: '',
    landArea: '',
  });

  const set = useCallback(
    (key: keyof typeof form) => (value: string) =>
      setForm((f) => ({ ...f, [key]: value })),
    []
  );

  /* ---------- NEXT STEP ---------- */
  function nextStep() {
    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        toast.error('Fill all fields');
        return;
      }
      if (form.password !== form.confirm) {
        toast.error('Passwords do not match');
        return;
      }
    }

    if (step === 2 && form.mobile.length !== 10) {
      toast.error('Invalid mobile');
      return;
    }

    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  }

  /* ---------- SUBMIT ---------- */
  async function submit() {
    setLoading(true);
    try {
      const { data, error } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
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

  /* ---------- UI ---------- */
  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2>Register (Step {step})</h2>

        {step === 1 && (
          <>
            <Field label="Name" value={form.name} onChange={set('name')} req />
            <Field label="Email" value={form.email} onChange={set('email')} />
            <Field
              label="Password"
              value={form.password}
              onChange={set('password')}
              type="password"
            />
            <Field
              label="Confirm"
              value={form.confirm}
              onChange={set('confirm')}
              type="password"
            />
          </>
        )}

        {step === 2 && (
          <>
            <Field
              label="Mobile"
              value={form.mobile}
              onChange={set('mobile')}
            />
            <Field
              label="Aadhaar"
              value={form.aadhaar}
              onChange={set('aadhaar')}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Field
              label="Land Area"
              value={form.landArea}
              onChange={set('landArea')}
            />
          </>
        )}

        <button onClick={nextStep} disabled={loading} style={styles.btn}>
          {loading ? 'Processing...' : step === 3 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
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
  },
  input: {
    width: '100%',
    height: '38px',
    marginTop: '5px',
    borderRadius: '6px',
    border: '1px solid #2d4a30',
    padding: '5px',
  },
  btn: {
    width: '100%',
    height: '40px',
    marginTop: '10px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '6px',
  },
};
