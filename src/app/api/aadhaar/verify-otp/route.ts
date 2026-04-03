import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { otp, aadhaarNumber } = await req.json();

    if (!otp || otp.toString().length !== 6) {
      return NextResponse.json({ success: false, error: 'Enter the 6-digit OTP' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get latest unverified record
    const { data: record } = await supabase
      .from('aadhaar_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_verified', false)
      .order('otp_sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'No active OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    const r = record as any;

    if (r.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many wrong attempts. Request a new OTP.' },
        { status: 429 }
      );
    }

    if (new Date() > new Date(r.otp_expires_at)) {
      return NextResponse.json(
        { success: false, error: 'OTP expired. Please request a new one.' },
        { status: 410 }
      );
    }

    if (r.otp_code !== otp.toString()) {
      await supabase
        .from('aadhaar_verifications')
        .update({ attempts: r.attempts + 1 })
        .eq('id', r.id);
      const left = 5 - (r.attempts + 1);
      return NextResponse.json(
        { success: false, error: `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} remaining.` },
        { status: 400 }
      );
    }

    // ✅ Correct — mark verified
    await supabase
      .from('aadhaar_verifications')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', r.id);

    // Save Aadhaar to farmer profile
    const cleaned = aadhaarNumber.replace(/\s/g, '');
    await supabase
      .from('farmer_profiles')
      .update({ aadhaar_number: cleaned })
      .eq('user_id', user.id);

    // Mark identity doc as verified in documents table
    const { data: profile } = await supabase
      .from('farmer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      await supabase
        .from('documents')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_data: {
            aadhaar_last4: cleaned.slice(-4),
            mobile_verified: r.mobile_number,
            verified_via: 'OTP_DEMO',
            verified_at: new Date().toISOString(),
          },
        })
        .eq('farmer_id', (profile as any).id)
        .eq('document_type', 'identity');
    }

    return NextResponse.json({
      success: true,
      message: '✅ Aadhaar verified successfully!',
      aadhaarLast4: cleaned.slice(-4),
    });

  } catch (err: any) {
    console.error('[verify-otp]', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}