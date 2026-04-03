'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  { key: 'identity',  label: 'Aadhaar Card',        icon: '🪪', otp: true  },
  { key: 'land',      label: 'Land Document (7/12)', icon: '🗺️', otp: false },
  { key: 'bank',      label: 'Bank Passbook',        icon: '🏦', otp: false },
  { key: 'photo',     label: 'Farmer Photo',         icon: '🧑‍🌾', otp: false },
  { key: 'income',    label: 'Income Certificate',   icon: '📃', otp: false },
  { key: 'landphoto', label: 'Land Photo',           icon: '🌾', otp: false },
];

function validateAadhaar(num: string): { valid: boolean; error: string } {
  const n = num.replace(/\s/g, '');
  if (n.length !== 12)              return { valid: false, error: 'Must be exactly 12 digits' };
  if (!/^\d{12}$/.test(n))          return { valid: false, error: 'Only digits allowed' };
  if (n[0] === '0' || n[0] === '1') return { valid: false, error: 'Cannot start with 0 or 1' };
  if (/^(\d)\1{11}$/.test(n))       return { valid: false, error: 'Invalid Aadhaar number' };
  return { valid: true, error: '' };
}

export default function DocumentsPage() {
  const sb = createClient();
  const [profile, setProfile]           = useState<any>(null);
  const [docs, setDocs]                 = useState<any[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [ready, setReady]               = useState(false);
  const [replacing, setReplacing]       = useState<string | null>(null); // which slot is in replace mode

  // Aadhaar OTP state
  const [aadhaarNumber, setAadhaarNumber]     = useState('');
  const [aadhaarOtp, setAadhaarOtp]           = useState('');
  const [aadhaarStep, setAadhaarStep]         = useState<'number' | 'otp' | 'done'>('number');
  const [demoOtp, setDemoOtp]                 = useState('');
  const [aadhaarLoading, setAadhaarLoading]   = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [numError, setNumError]               = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data: p } = await sb
      .from('farmer_profiles').select('*').eq('user_id', user.id).maybeSingle();
    setProfile(p || null);
    if (p) {
      const { data: d } = await sb
        .from('documents').select('*').eq('farmer_id', p.id)
        .order('created_at', { ascending: false });
      setDocs(d || []);
      const { data: av } = await sb
        .from('aadhaar_verifications').select('is_verified')
        .eq('user_id', user.id).eq('is_verified', true).maybeSingle();
      if (av) { setAadhaarVerified(true); setAadhaarStep('done'); }
    }
    setReady(true);
  }

  function handleAadhaarInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(digits);
    if (digits.length === 12) {
      const { valid, error } = validateAadhaar(digits);
      setNumError(valid ? '' : error);
    } else {
      setNumError('');
    }
  }

  async function sendOtp() {
    const { valid, error } = validateAadhaar(aadhaarNumber);
    if (!valid) { toast.error(error); return; }
    if (!profile?.mobile_number) { toast.error('Add mobile number in your Profile first'); return; }
    setAadhaarLoading(true);
    try {
      const res  = await fetch('/api/aadhaar/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber, mobileNumber: profile.mobile_number }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error); return; }
      setDemoOtp(data.demo_otp);
      setAadhaarStep('otp');
      toast.success('OTP generated!');
    } catch { toast.error('Failed — try again'); }
    finally { setAadhaarLoading(false); }
  }

  async function verifyOtp() {
    if (aadhaarOtp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setAadhaarLoading(true);
    try {
      const res  = await fetch('/api/aadhaar/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: aadhaarOtp, aadhaarNumber }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error); return; }
      toast.success('✅ Aadhaar verified! Now upload your Aadhaar card image.');
      setAadhaarVerified(true);
      setAadhaarStep('done');
      setDemoOtp('');
      loadData();
    } catch { toast.error('Verification failed'); }
    finally { setAadhaarLoading(false); }
  }

  // ── Upload: deletes old file for same type first if replacing ──
  async function uploadDoc(file: File, type: string) {
    if (!profile) { toast.error('Complete your profile first'); return; }
    setUploadingKey(type);
    try {
      // If replacing, delete the old file first
      const existing = docs.find((d: any) => d.document_type === type);
      if (existing) {
        if (existing.file_path) {
          await sb.storage.from('farmer-documents').remove([existing.file_path]);
        }
        await sb.from('documents').delete().eq('id', existing.id);
      }

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${profile.user_id}/${type}_${Date.now()}_${safe}`;
      const { error: upErr } = await sb.storage
        .from('farmer-documents').upload(path, file, { contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data: urlData } = sb.storage.from('farmer-documents').getPublicUrl(path);
      const { error: dbErr } = await sb.from('documents').insert({
        farmer_id: profile.id, user_id: profile.user_id,
        document_name: file.name, document_type: type,
        file_url: urlData.publicUrl, file_path: path,
        file_size: file.size, mime_type: file.type,
      });
      if (dbErr) throw new Error(dbErr.message);
      toast.success(`✅ ${file.name} uploaded!`);
      setReplacing(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  }

  async function deleteDoc(doc: any) {
    if (doc.file_path) await sb.storage.from('farmer-documents').remove([doc.file_path]);
    await sb.from('documents').delete().eq('id', doc.id);
    toast.success('Document removed');
    setReplacing(null);
    loadData();
  }

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: 'Nunito,sans-serif', fontSize: '14px', color: '#6b7280' }}>
      Loading...
    </div>
  );

  const pct = Math.min(Math.round(docs.length / DOC_TYPES.length * 100), 100);
  const aadhaarDone = aadhaarVerified || aadhaarStep === 'done';

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px 48px', fontFamily: 'Nunito, sans-serif' }}>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>📄 Upload Documents</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>One document per slot · All 6 required before validator review</p>
      </div>

      {/* Progress */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Progress</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: pct === 100 ? '#16a34a' : '#e65100' }}>
            {docs.length} / {DOC_TYPES.length}
          </span>
        </div>
        <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', transition: 'width .4s',
            background: pct === 100 ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,#f59e0b,#fcd34d)' }} />
        </div>
        {pct === 100 && <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, margin: '8px 0 0' }}>✅ All uploaded! Ready for validator review.</p>}
      </div>

      {!profile && (
        <div style={{ padding: '20px', textAlign: 'center', background: '#fff3e0', borderRadius: '12px', border: '1px solid #ffe0b2', marginBottom: '16px' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>⚠️</div>
          <div style={{ fontWeight: 700, color: '#e65100' }}>Complete your profile first</div>
        </div>
      )}

      {profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {DOC_TYPES.map(dt => {
            // Only keep the LATEST file per document type
            const slotDoc         = docs.find((d: any) => d.document_type === dt.key) || null;
            const isUploaded      = !!slotDoc;
            const isAadhaar       = dt.key === 'identity';
            const isThisUploading = uploadingKey === dt.key;
            const isReplacing     = replacing === dt.key;

            return (
              <div key={dt.key} style={{
                background: 'white',
                border: `2px solid ${isUploaded ? '#22c55e' : isAadhaar && !aadhaarDone ? '#f59e0b' : '#e5e7eb'}`,
                borderRadius: '12px', padding: '16px',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* colour strip */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: '12px 12px 0 0',
                  background: isUploaded ? 'linear-gradient(90deg,#22c55e,#86efac)'
                    : isAadhaar && !aadhaarDone ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : '#e5e7eb' }} />

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '4px' }}>
                  {/* Icon */}
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                    background: isUploaded ? '#dcfce7' : isAadhaar && !aadhaarDone ? '#fef3c7' : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {dt.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Title + status badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#111' }}>{dt.label}</span>
                      {isAadhaar && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                          background: aadhaarDone ? '#dcfce7' : '#fef3c7',
                          color: aadhaarDone ? '#16a34a' : '#d97706',
                          border: `1px solid ${aadhaarDone ? '#86efac' : '#fde68a'}` }}>
                          {aadhaarDone ? '🔐 OTP Verified' : '🔐 OTP Required'}
                        </span>
                      )}
                      {isUploaded
                        ? <span style={{ fontSize: '10px', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '99px', fontWeight: 700, border: '1px solid #86efac' }}>✓ Uploaded</span>
                        : (!isAadhaar || aadhaarDone) && <span style={{ fontSize: '10px', background: '#fff3e0', color: '#e65100', padding: '2px 8px', borderRadius: '99px', fontWeight: 700, border: '1px solid #fed7aa' }}>Required</span>
                      }
                    </div>

                    {/* ══ AADHAAR OTP FLOW ══ */}
                    {isAadhaar && !aadhaarDone && (
                      <div>
                        {/* STEP 1 — Enter number */}
                        {aadhaarStep === 'number' && (
                          <div>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                              Enter your 12-digit Aadhaar number to receive a verification OTP
                            </p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '200px' }}>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  value={aadhaarNumber}
                                  onChange={e => handleAadhaarInput(e.target.value)}
                                  placeholder="Enter 12-digit Aadhaar"
                                  maxLength={12}
                                  autoComplete="off"
                                  style={{ width: '100%', height: '46px', boxSizing: 'border-box',
                                    border: `2px solid ${numError ? '#ef4444' : aadhaarNumber.length === 12 && !numError ? '#22c55e' : '#d1d5db'}`,
                                    borderRadius: '9px', padding: '0 14px',
                                    fontSize: '18px', fontFamily: 'monospace', letterSpacing: '4px',
                                    color: '#111', outline: 'none', background: '#f9fafb' }}
                                />
                                {numError
                                  ? <p style={{ fontSize: '11px', color: '#ef4444', margin: '3px 0 0', fontWeight: 600 }}>❌ {numError}</p>
                                  : aadhaarNumber.length === 12
                                  ? <p style={{ fontSize: '11px', color: '#16a34a', margin: '3px 0 0', fontWeight: 600 }}>✅ Valid format</p>
                                  : <p style={{ fontSize: '11px', color: '#9ca3af', margin: '3px 0 0' }}>{aadhaarNumber.length}/12</p>
                                }
                              </div>
                              <button
                                onClick={sendOtp}
                                disabled={aadhaarLoading || aadhaarNumber.length !== 12 || !!numError}
                                style={{ height: '46px', padding: '0 18px', borderRadius: '9px', border: 'none',
                                  background: aadhaarNumber.length === 12 && !numError ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#e5e7eb',
                                  color: aadhaarNumber.length === 12 && !numError ? 'white' : '#9ca3af',
                                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                  fontFamily: 'Nunito,sans-serif', whiteSpace: 'nowrap',
                                  opacity: aadhaarLoading ? 0.6 : 1 }}>
                                {aadhaarLoading ? '⏳...' : '📱 Send OTP'}
                              </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                              OTP → +91 {profile?.mobile_number?.slice(0,2)}XXXXXX{profile?.mobile_number?.slice(-2)}
                            </p>
                          </div>
                        )}

                        {/* STEP 2 — Enter OTP */}
                        {aadhaarStep === 'otp' && demoOtp && (
                          <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ background: '#0f172a', borderRadius: '9px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 700 }}>📱 DEMO OTP</span>
                              <span style={{ fontSize: '26px', fontFamily: 'monospace', fontWeight: 900, color: '#4ade80', letterSpacing: '8px', flex: 1 }}>{demoOtp}</span>
                              <span style={{ fontSize: '9px', color: '#475569', background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>Prod: SMS</span>
                            </div>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', marginBottom: '8px' }}>Enter the OTP:</p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={aadhaarOtp}
                                onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="— — — — — —"
                                maxLength={6}
                                autoComplete="one-time-code"
                                style={{ width: '150px', height: '50px', border: '2px solid #22c55e', borderRadius: '10px', fontSize: '22px', fontFamily: 'monospace', letterSpacing: '6px', textAlign: 'center', fontWeight: 800, color: '#111', outline: 'none', background: 'white' }}
                              />
                              <button
                                onClick={verifyOtp}
                                disabled={aadhaarLoading || aadhaarOtp.length !== 6}
                                style={{ height: '50px', padding: '0 18px', borderRadius: '10px', border: 'none',
                                  background: aadhaarOtp.length === 6 ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e5e7eb',
                                  color: aadhaarOtp.length === 6 ? 'white' : '#9ca3af',
                                  fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
                                  opacity: aadhaarLoading ? 0.6 : 1 }}>
                                {aadhaarLoading ? '⏳' : '✅ Verify'}
                              </button>
                              <button
                                onClick={() => { setAadhaarStep('number'); setAadhaarOtp(''); setDemoOtp(''); }}
                                style={{ height: '50px', padding: '0 12px', borderRadius: '10px', border: '1px solid #d1d5db', background: 'white', color: '#6b7280', fontSize: '11px', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                                🔄 Change
                              </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>⏱️ Expires in 10 min · Max 5 attempts</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ══ UPLOADED FILE (ONE per slot) ══ */}
                    {isUploaded && slotDoc && (
                      <div>
                        {/* File row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '16px' }}>📎</span>
                          <a href={slotDoc.file_url} target="_blank" rel="noreferrer"
                            style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {slotDoc.document_name}
                          </a>
                          <span style={{ fontSize: '10px', color: '#6b7280', flexShrink: 0 }}>
                            {slotDoc.file_size ? `${(slotDoc.file_size / 1024).toFixed(0)} KB` : ''}
                          </span>
                          {isAadhaar && <span style={{ fontSize: '10px', background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: '99px', fontWeight: 700, flexShrink: 0 }}>OTP ✓</span>}
                        </div>

                        {/* Replace / Delete options */}
                        {!isReplacing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Replace button — only show if OTP done for Aadhaar */}
                            {(!isAadhaar || aadhaarDone) && (
                              <button
                                onClick={() => setReplacing(dt.key)}
                                style={{ padding: '6px 14px', background: 'white', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                                🔄 Replace
                              </button>
                            )}
                            <button
                              onClick={() => deleteDoc(slotDoc)}
                              style={{ padding: '6px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#dc2626', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                              🗑️ Remove
                            </button>
                          </div>
                        ) : (
                          /* Replace mode — show file picker */
                          <div style={{ padding: '10px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '9px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', marginBottom: '8px' }}>
                              ⚠️ This will replace your current file. Choose new file:
                            </p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', borderRadius: '8px', cursor: isThisUploading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: isThisUploading ? 0.6 : 1 }}>
                                {isThisUploading ? '⏳ Uploading...' : '📎 Choose file'}
                                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} disabled={isThisUploading}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, dt.key); e.target.value = ''; }} />
                              </label>
                              <button
                                onClick={() => setReplacing(null)}
                                style={{ padding: '7px 12px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#6b7280', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ══ NOT UPLOADED YET ══ */}
                    {!isUploaded && (
                      <div>
                        {/* Aadhaar: show upload only after OTP verified */}
                        {isAadhaar && aadhaarDone && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '10px', width: 'fit-content' }}>
                              <span>✅</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                                Aadhaar XXXX XXXX {aadhaarNumber.slice(-4) || '—'} verified
                              </span>
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', borderRadius: '9px', cursor: isThisUploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, opacity: isThisUploading ? 0.6 : 1 }}>
                              {isThisUploading ? '⏳ Uploading...' : '📎 Upload Aadhaar Card'}
                              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} disabled={isThisUploading}
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, 'identity'); e.target.value = ''; }} />
                            </label>
                          </div>
                        )}

                        {/* Aadhaar: locked until OTP done */}
                        {isAadhaar && !aadhaarDone && (
                          <div style={{ padding: '8px 12px', background: '#fef3c7', border: '1px dashed #fde68a', borderRadius: '8px', fontSize: '12px', color: '#d97706', fontWeight: 600 }}>
                            🔒 Complete OTP verification above to unlock upload
                          </div>
                        )}

                        {/* All other docs */}
                        {!isAadhaar && (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#fafafa', border: '1.5px dashed #d1d5db', borderRadius: '8px', cursor: isThisUploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, color: '#6b7280', opacity: isThisUploading ? 0.6 : 1 }}>
                            {isThisUploading ? '⏳ Uploading...' : `📎 Upload ${dt.label}`}
                            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} disabled={isThisUploading}
                              onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, dt.key); e.target.value = ''; }} />
                          </label>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '12px', color: '#6b7280' }}>
        🔐 Aadhaar verified via OTP · One document per slot · Securely stored in Supabase Storage
      </div>
    </div>
  );
}
