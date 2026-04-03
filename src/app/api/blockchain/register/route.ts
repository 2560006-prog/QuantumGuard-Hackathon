import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerFarmerOnChain } from '@/lib/blockchain';

export async function POST(req: NextRequest) {
  console.log('[API] /api/blockchain/register called');
  try {
    const body = await req.json();
    const { farmerId, name, mobile, aadhaarLast4, profileId } = body;
    console.log('[API] Registering:', { farmerId, name, profileId });

    if (!farmerId || !name || !profileId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await registerFarmerOnChain(farmerId, name, mobile || '', aadhaarLast4 || '0000');
    console.log('[API] Blockchain result:', result);

    if (result.success && result.txHash) {
      const supabase = await createClient();
      const { error: updateErr } = await supabase
        .from('farmer_profiles')
        .update({
          blockchain_tx_hash: result.txHash,
          blockchain_block_number: result.blockNumber,
          blockchain_registered_at: new Date().toISOString(),
          identity_hash: farmerId,
          contract_address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        })
        .eq('id', profileId);

      if (updateErr) {
        console.error('[API] DB save failed:', updateErr.message);
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      console.log('[API] Saved to DB for profile:', profileId);
      return NextResponse.json({ success: true, txHash: result.txHash, blockNumber: result.blockNumber });
    }

    return NextResponse.json({ success: false, error: result.error || 'Blockchain failed' }, { status: 500 });
  } catch (err: any) {
    console.error('[API] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}