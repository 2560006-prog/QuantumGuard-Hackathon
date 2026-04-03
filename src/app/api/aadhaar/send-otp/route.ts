import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { aadhaarNumber, mobileNumber } = await req.json();

    // Validate Aadhaar — exactly 12 digits
    const cleaned = aadhaarNumber.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleaned)) {
      return NextResponse.json(
        { success: false, error: 'Aadhaar must be exactly 12 digits' },
        { status: 400 }
      );
    }
    // First digit cannot be 0 or 1
    if (cleaned[0] === '0' || cleaned[0] === '1') {
      return NextResponse.json(
        { success: false, error: 'Invalid Aadhaar number — cannot start with 0 or 1' },
        { status: 400 }
      );
    }
    // Cannot be all same digits
    if (/^(\d)\1{11}$/.test(cleaned)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Aadhaar number' },
        { status: 400 }
      );
    }
    // Validate mobile
    if (!/^\d{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { success: false, error: 'Mobile number must be 10 digits' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Check already verified
    const { data: alreadyDone } = await supabase
      .from('aadhaar_verifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_verified', true)
      .maybeSingle();
    if (alreadyDone) {
      return NextResponse.json(
        { success: false, error: 'Aadhaar already verified for this account' },
        { status: 400 }
      );
    }

    // Rate limit — max 5 per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from('aadhaar_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('otp_sent_at', oneHourAgo);
    if ((count || 0) >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please wait 1 hour.' },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 600000).toISOString(); // 10 min

    // Save to DB
    await supabase.from('aadhaar_verifications').insert({
      user_id: user.id,
      aadhaar_last4: cleaned.slice(-4),
      otp_code: otp,
      otp_expires_at: expiresAt,
      mobile_number: mobileNumber,
      is_verified: false,
      attempts: 0,
    });

    console.log(`[DEMO OTP] ${user.email} → ${otp}`);

    // DEMO MODE — return OTP directly
    // Production: replace with Twilio/MSG91 SMS call
    return NextResponse.json({
      success: true,
      demo_otp: otp,
      aadhaarLast4: cleaned.slice(-4),
      maskedMobile: mobileNumber.slice(0,2) + 'XXXXXX' + mobileNumber.slice(-2),
      message: 'OTP generated successfully',
    });

  } catch (err: any) {
    console.error('[send-otp]', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}