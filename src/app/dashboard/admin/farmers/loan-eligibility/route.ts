// QuantumGuard — Loan Eligibility API
// Calculates farmer loan eligibility based on profile data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get farmer profile
    const { data: profile } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Get documents count
    const { count: docCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', (profile as any).id);

    // Get verification status
    const { data: verification } = await supabase
      .from('verification_status')
      .select('status')
      .eq('farmer_id', (profile as any).id)
      .maybeSingle();

    const p = profile as any;
    const landArea     = parseFloat(p.land_area) || 0;
    const isVerified   = (verification as any)?.status === 'approved';
    const hasBlockchain = !!p.blockchain_tx_hash;
    const hasBank      = !!p.bank_name && !!p.account_number && !!p.ifsc_code;
    const docsUploaded = (docCount || 0) >= 3;

    // ── Eligibility Calculation ──
    let score        = 0;
    const breakdown: any[] = [];

    // Land area score (max 40 points)
    if (landArea >= 10) {
      score += 40;
      breakdown.push({ factor: 'Land Area', points: 40, note: `${landArea} acres — Excellent` });
    } else if (landArea >= 5) {
      score += 30;
      breakdown.push({ factor: 'Land Area', points: 30, note: `${landArea} acres — Good` });
    } else if (landArea >= 2) {
      score += 20;
      breakdown.push({ factor: 'Land Area', points: 20, note: `${landArea} acres — Average` });
    } else if (landArea > 0) {
      score += 10;
      breakdown.push({ factor: 'Land Area', points: 10, note: `${landArea} acres — Below average` });
    } else {
      breakdown.push({ factor: 'Land Area', points: 0, note: 'No land area recorded' });
    }

    // Verification score (25 points)
    if (isVerified) {
      score += 25;
      breakdown.push({ factor: 'Verification', points: 25, note: 'Profile approved by validator' });
    } else {
      breakdown.push({ factor: 'Verification', points: 0, note: 'Profile not yet verified' });
    }

    // Blockchain registration (20 points)
    if (hasBlockchain) {
      score += 20;
      breakdown.push({ factor: 'Blockchain Identity', points: 20, note: 'Registered on Ethereum Sepolia' });
    } else {
      breakdown.push({ factor: 'Blockchain Identity', points: 0, note: 'Not yet registered on blockchain' });
    }

    // Bank account (10 points)
    if (hasBank) {
      score += 10;
      breakdown.push({ factor: 'Bank Account', points: 10, note: 'Bank details complete' });
    } else {
      breakdown.push({ factor: 'Bank Account', points: 0, note: 'Bank details incomplete' });
    }

    // Documents (5 points)
    if (docsUploaded) {
      score += 5;
      breakdown.push({ factor: 'Documents', points: 5, note: `${docCount} documents uploaded` });
    } else {
      breakdown.push({ factor: 'Documents', points: 0, note: `Only ${docCount || 0} documents uploaded` });
    }

    // ── Loan Amount Calculation ──
    const baseAmount  = landArea * 50000; // ₹50,000 per acre
    const maxLoan     = Math.min(baseAmount * (score / 100), 1000000); // max ₹10 lakh
    const eligible    = score >= 50;

    return NextResponse.json({
      success: true,
      eligible,
      score,
      maxScore: 100,
      percentage: score,
      maxLoanAmount: Math.round(maxLoan),
      breakdown,
      eligibilityStatus: score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low',
      message: eligible
        ? `✅ Eligible for loan up to ₹${Math.round(maxLoan).toLocaleString('en-IN')}`
        : '❌ Not yet eligible — improve your score by completing verification',
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}