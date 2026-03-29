import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerFarmerOnChain } from '@/lib/blockchain';

export async function POST(req: NextRequest) {
  try {
    const { farmerId, name, mobile, aadhaarLast4, profileId } = await req.json();

    const result = await registerFarmerOnChain(farmerId, name, mobile, aadhaarLast4);

    if (result.success && result.txHash) {
      const supabase = await createClient();
      const db = supabase as any;
      await db
        .from('farmer_profiles')
        .update({
          blockchain_tx_hash: result.txHash,
          blockchain_block_number: result.blockNumber,
          blockchain_registered_at: new Date().toISOString(),
          contract_address: process.env.CONTRACT_ADDRESS,
        })
        .eq('id', profileId);

      return NextResponse.json({ success: true, txHash: result.txHash });
    }

    return NextResponse.json({ success: false });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}