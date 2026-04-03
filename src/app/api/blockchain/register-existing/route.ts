import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerFarmerOnChain } from '@/lib/blockchain';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: farmers, error } = await supabase
      .from('farmer_profiles')
      .select('id, full_name, mobile_number, aadhaar_number')
      .is('blockchain_tx_hash', null)
      .neq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

    if (error) throw error;
    if (!farmers || farmers.length === 0) {
      return NextResponse.json({ success: true, message: 'No farmers to register', count: 0 });
    }

    console.log(`[Blockchain] Registering ${farmers.length} farmers...`);
    const results = [];

    for (const farmer of farmers as any[]) {
      const farmerId = 'QG-' + farmer.id.slice(0, 8).toUpperCase();
      const result = await registerFarmerOnChain(
        farmerId,
        farmer.full_name || 'Unknown',
        farmer.mobile_number || '',
        (farmer.aadhaar_number || '').replace(/\s/g, '').slice(-4) || '0000'
      );

      if (result.success && result.txHash) {
        await supabase.from('farmer_profiles').update({
          blockchain_tx_hash: result.txHash,
          blockchain_block_number: result.blockNumber,
          blockchain_registered_at: new Date().toISOString(),
          identity_hash: farmerId,
          contract_address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        }).eq('id', farmer.id);

        results.push({ farmer: farmer.full_name, farmerId, txHash: result.txHash, success: true });
        console.log(`[Blockchain] ✅ ${farmer.full_name}: ${result.txHash}`);
      } else {
        results.push({ farmer: farmer.full_name, farmerId, success: false, error: result.error });
        console.error(`[Blockchain] ❌ ${farmer.full_name}: ${result.error}`);
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}