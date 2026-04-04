// QuantumGuard — Farmer Credit Score API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { data: profile } = await supabase
      .from('farmer_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (!profile) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });

    const p = profile as any;

    const { count: docCount } = await supabase
      .from('documents').select('*', { count: 'exact', head: true }).eq('farmer_id', p.id);

    const { data: verification } = await supabase
      .from('verification_status').select('status').eq('farmer_id', p.id).maybeSingle();

    const { data: aadhaarVerified } = await supabase
      .from('aadhaar_verifications').select('is_verified')
      .eq('user_id', user.id).eq('is_verified', true).maybeSingle();

    const BASE = 300;
    let earned = 0;
    const MAX  = 600;
    const factors: any[] = [];

    // Land Area (max 150)
    const land = parseFloat(p.land_area) || 0;
    let landPts = 0;
    if      (land >= 20) landPts = 150;
    else if (land >= 10) landPts = 120;
    else if (land >= 5)  landPts = 90;
    else if (land >= 2)  landPts = 60;
    else if (land >  0)  landPts = 30;
    earned += landPts;
    factors.push({ label: 'Land Holdings', earned: landPts, max: 150,
      icon: '🌾', detail: land > 0 ? `${land} acres` : 'Not recorded', color: '#16a34a' });

    // Documents (max 120)
    const docs   = docCount || 0;
    const docPts = Math.min(docs * 20, 120);
    earned += docPts;
    factors.push({ label: 'Document Completeness', earned: docPts, max: 120,
      icon: '📄', detail: `${docs}/6 documents uploaded`, color: '#2563eb' });

    // Blockchain (max 120)
    const chainPts = p.blockchain_tx_hash ? 120 : 0;
    earned += chainPts;
    factors.push({ label: 'Blockchain Identity', earned: chainPts, max: 120,
      icon: '⛓️', detail: p.blockchain_tx_hash ? 'Registered on Ethereum' : 'Not registered', color: '#7c3aed' });

    // Verification (max 100)
    const status = (verification as any)?.status;
    const verPts = status === 'approved' ? 100 : status === 'under_review' ? 50 : 0;
    earned += verPts;
    factors.push({ label: 'Validator Verification', earned: verPts, max: 100,
      icon: '✅', detail: status ? status.replace('_', ' ').toUpperCase() : 'PENDING', color: '#d97706' });

    // Aadhaar (max 70)
    const aadhaarPts = aadhaarVerified ? 70 : 0;
    earned += aadhaarPts;
    factors.push({ label: 'Aadhaar Verification', earned: aadhaarPts, max: 70,
      icon: '🪪', detail: aadhaarVerified ? 'OTP Verified' : 'Not verified', color: '#dc2626' });

    // Bank (max 40)
    const hasBank = p.bank_name && p.account_number && p.ifsc_code;
    const bankPts = hasBank ? 40 : 0;
    earned += bankPts;
    factors.push({ label: 'Bank Account Linked', earned: bankPts, max: 40,
      icon: '🏦', detail: hasBank ? p.bank_name : 'Not linked', color: '#0891b2' });

    const total = BASE + earned;

    let grade = 'E', gradeLabel = 'Poor', gradeColor = '#dc2626';
    if      (total >= 800) { grade = 'A+'; gradeLabel = 'Excellent'; gradeColor = '#16a34a'; }
    else if (total >= 750) { grade = 'A';  gradeLabel = 'Very Good'; gradeColor = '#22c55e'; }
    else if (total >= 700) { grade = 'B+'; gradeLabel = 'Good';      gradeColor = '#84cc16'; }
    else if (total >= 650) { grade = 'B';  gradeLabel = 'Fair';      gradeColor = '#eab308'; }
    else if (total >= 550) { grade = 'C';  gradeLabel = 'Average';   gradeColor = '#f97316'; }
    else if (total >= 450) { grade = 'D';  gradeLabel = 'Below Avg'; gradeColor = '#ef4444'; }

    const maxLoan = Math.round(land * 50000 * (earned / MAX));

    await supabase.from('farmer_credit_scores').upsert({
      farmer_id: p.id, user_id: user.id,
      total_score: total, max_score: 900, grade,
      land_score: landPts, docs_score: docPts,
      blockchain_score: chainPts, verification_score: verPts,
      bank_score: bankPts, income_score: aadhaarPts,
      calculated_at: new Date().toISOString(),
    }, { onConflict: 'farmer_id' });

    return NextResponse.json({
      success: true,
      score: total, maxScore: 900, minScore: 300,
      percentage: Math.round((earned / MAX) * 100),
      grade, gradeLabel, gradeColor,
      earned, maxEarnable: MAX,
      maxLoanAmount: maxLoan,
      factors,
      tips: [
        ...(chainPts === 0   ? ['Register on blockchain to earn 120 points'] : []),
        ...(verPts   === 0   ? ['Get verified by a validator for 100 points'] : []),
        ...(aadhaarPts === 0 ? ['Complete Aadhaar OTP verification for 70 points'] : []),
        ...(docs < 6         ? [`Upload ${6 - docs} more documents for ${(6-docs)*20} points`] : []),
        ...(bankPts === 0    ? ['Link your bank account for 40 points'] : []),
      ],
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}