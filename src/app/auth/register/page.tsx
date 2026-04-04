'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// ── Outside component — never recreated ──
const STEPS = [
  { title: 'Account Details', sub: 'Step 1 of 3' },
  { title: 'Personal Info', sub: 'Step 2 of 3' },
  { title: 'Farm Details', sub: 'Step 3 of 3' },
];

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Nunito', sans-serif; background: #0f1a12; color: #e8f5e9; }
  .reg-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .reg-box { width: 100%; max-width: 480px; background: #1a2b1c; border: 1px solid #2d4a30; border-radius: 16px; padding: 32px; }
  .reg-title { font-size: 22px; font-weight: 800; color: #f0fdf4; margin-bottom: 4px; }
  .reg-sub { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .field input, .field select { width: 100%; height: 46px; background: #111b13; border: 1.5px solid #2d4a30; border-radius: 9px; padding: 0 13px; font-size: 14px; color: #e8f5e9; outline: none; transition: border-color .2s; font-family: 'Nunito', sans-serif; }
  .field input:focus, .field select:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.08); }
  .field input::placeholder { color: #374151; }
  .field select option { background: #1a2b1c; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  .btn-next { width: 100%; height: 48px; border-radius: 10px; border: none; background: linear-gradient(135deg,#22c55e,#16a34a); color: white; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; font-family: 'Nunito', sans-serif; }
  .btn-next:disabled { opacity: .5; cursor: not-allowed; }
  .btn-back { width: 100%; height: 44px; border-radius: 10px; border: 1.5px solid #2d4a30; background: transparent; color: #6b7280; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; font-family: 'Nunito', sans-serif; }
  .stepper { display: flex; gap: 8px; align-items: center; margin-bottom: 24px; }
  .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; border: 2px solid; transition: .2s; }
  .step-dot.done { background: #22c55e; border-color: #22c55e; color: white; }
  .step-dot.cur { background: transparent; border-color: #4ade80; color: #4ade80; }
  .step-dot.next { background: transparent; border-color: #1e3520; color: #2d4a30; }
  .step-line { flex: 1; height: 2px; }
  .step-line.done { background: #22c55e; }
  .step-line.next { background: #1e3520; }
  .signin { text-align: center; font-size: 13px; color: #4b5563; margin-top: 14px; }
  .signin a { color: #4ade80; font-weight: 700; text-decoration: none; }
`;

export default function RegisterPage() {
  const router = useRouter();
  const sb = createClient();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Single flat form state — NO refs ──
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    mobile: '', aadhaar: '',
    landArea: '', cropType: 'Wheat', state: 'Maharashtra',
    bankName: '', accountNumber: '', ifsc: '',
  });

  useEffect(() => { setMounted(true); }, []);

  // ── useCallback so set() never recreates ──
  const set = useCallback(
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
    []
  );

  function nextStep() {
    if (step === 1) {
      if (!form.name.trim())  { toast.error('Name is required'); return; }
      if (!form.email.trim()) { toast.error('Email is required'); return; }
      if (!form.password)     { toast.error('Password is required'); return; }
      if (form.password.length < 6) { toast.error('Password must be 6+ chars'); return; }
      if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    }
    if (step === 2) {
      if (form.mobile.length !== 10) { toast.error('Enter 10-digit mobile'); return; }
      if (!form.aadhaar.trim()) { toast.error('Aadhaar is required'); return; }
    }
    if (step === 3) { submit(); return; }
    setStep(s => s + 1);
  }

  async function submit() {
    setLoading(true);
    try {
      const { data, error } = await sb.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { full_name: form.name.trim(), role: 'farmer' } },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Registration failed');

      // Sign in immediately
      const { data: si } = await sb.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (!si?.user) { toast.error('Account created — please login'); router.push('/auth/login'); return; }

      // Create farmer profile
      await sb.from('farmer_profiles').insert({
        user_id: data.user.id,
        full_name: form.name.trim(),
        mobile_number: form.mobile.trim(),
        aadhaar_number: form.aadhaar.replace(/\s/g, ''),
        land_area: parseFloat(form.landArea) || 0,
        land_unit: 'acres',
        crop_type: form.cropType,
        bank_name: form.bankName.trim(),
        account_number: form.accountNumber.trim(),
        ifsc_code: form.ifsc.trim().toUpperCase(),
        account_holder_name: form.name.trim(),
      });

      toast.success('✅ Welcome to QuantumGuard!');
      router.push('/dashboard/farmer');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div className="reg-wrap">
        <div className="reg-box">

          {/* Stepper */}
          <div className="stepper">
            {[1,2,3].map((n, i) => (<>
              <div key={n} className={`step-dot ${step > n ? 'done' : step === n ? 'cur' : 'next'}`}>
                {step > n ? '✓' : n}
              </div>
              {i < 2 && <div key={'l'+n} className={`step-line ${step > n ? 'done' : 'next'}`} />}
            </>))}
          </div>

          <div className="reg-title">{STEPS[step-1].title}</div>
          <div className="reg-sub">{STEPS[step-1].sub}</div>

          {/* ── STEP 1 ── */}
          {step === 1 && <>
            <div className="field">
              <label>Full Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Ramesh Bhosale" autoComplete="name" />
            </div>
            <div className="field">
              <label>Email Address *</label>
              <input value={form.email} onChange={set('email')} type="email" placeholder="your@email.com" autoComplete="email" />
            </div>
            <div className="grid2">
              <div className="field">
                <label>Password *</label>
                <input value={form.password} onChange={set('password')} type="password" placeholder="Min 6 chars" autoComplete="new-password" />
              </div>
              <div className="field">
                <label>Confirm Password *</label>
                <input value={form.confirm} onChange={set('confirm')} type="password" placeholder="Repeat password" autoComplete="new-password" />
              </div>
            </div>
          </>}

          {/* ── STEP 2 ── */}
          {step === 2 && <>
            <div className="grid2">
              <div className="field">
                <label>Mobile Number *</label>
                <input value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile" maxLength={10} inputMode="numeric" />
              </div>
              <div className="field">
                <label>Aadhaar Number *</label>
                <input value={form.aadhaar} onChange={set('aadhaar')} placeholder="XXXX XXXX XXXX" maxLength={14} />
              </div>
            </div>
            <div className="field">
              <label>State</label>
              <select value={form.state} onChange={set('state')}>
                {['Maharashtra','Karnataka','Punjab','Haryana','Uttar Pradesh','Madhya Pradesh','Gujarat','Tamil Nadu','Kerala','Rajasthan'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </>}

          {/* ── STEP 3 ── */}
          {step === 3 && <>
            <div className="grid2">
              <div className="field">
                <label>Land Area (Acres)</label>
                <input value={form.landArea} onChange={set('landArea')} type="number" placeholder="e.g. 3.5" />
              </div>
              <div className="field">
                <label>Crop Type</label>
                <select value={form.cropType} onChange={set('cropType')}>
                  {['Wheat','Sugarcane','Rice / Paddy','Soybean','Cotton','Onion','Grapes','Turmeric','Maize'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Bank Name</label>
              <input value={form.bankName} onChange={set('bankName')} placeholder="e.g. State Bank of India" />
            </div>
            <div className="grid2">
              <div className="field">
                <label>Account Number</label>
                <input value={form.accountNumber} onChange={set('accountNumber')} placeholder="Account number" />
              </div>
              <div className="field">
                <label>IFSC Code</label>
                <input value={form.ifsc} onChange={set('ifsc')} placeholder="e.g. SBIN0001234" />
              </div>
            </div>
          </>}

          {/* Buttons */}
          {step > 1 && (
            <button className="btn-back" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <button className="btn-next" onClick={nextStep} disabled={loading}>
            {loading ? '⏳ Registering...' : step === 3 ? '🚀 Complete Registration' : 'Next Step →'}
          </button>

          <div className="signin">
            Already registered? <a href="/auth/login">Sign in →</a>
          </div>

        </div>
      </div>
    </>
  );
}
