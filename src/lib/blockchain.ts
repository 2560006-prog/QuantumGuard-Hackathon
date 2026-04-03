import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;


const ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "farmerId", "type": "string" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "mobile", "type": "string" },
      { "internalType": "string", "name": "aadhaarLast4", "type": "string" }
    ],
    "name": "registerFarmer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "farmerId", "type": "string" }
    ],
    "name": "verifyFarmer",
    "outputs": [
      { "internalType": "bool", "name": "exists", "type": "bool" },
      { "internalType": "bytes32", "name": "identityHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOwner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function registerFarmerOnChain(
  farmerId: string,
  name: string,
  mobile: string,
  aadhaarLast4: string
): Promise<{ success: boolean; txHash: string | null; blockNumber: string | null; error?: string }> {

  if (!CONTRACT_ADDRESS) return { success: false, txHash: null, blockNumber: null, error: 'CONTRACT_ADDRESS not set' };
  if (!RPC_URL) return { success: false, txHash: null, blockNumber: null, error: 'SEPOLIA_RPC_URL not set' };
  if (!PRIVATE_KEY) return { success: false, txHash: null, blockNumber: null, error: 'DEPLOYER_PRIVATE_KEY not set' };

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    console.log(`[Blockchain] Registering farmer ${farmerId}`);
    const tx = await contract.registerFarmer(farmerId, name, mobile, aadhaarLast4);
    console.log(`[Blockchain] TX sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[Blockchain] Confirmed in block: ${receipt.blockNumber}`);
    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber.toString() };
  } catch (err: any) {
    console.error('[Blockchain] Error:', err.message);
    return { success: false, txHash: null, blockNumber: null, error: err.message };
  }
}

export async function verifyFarmerOnChain(farmerId: string) {
  if (!CONTRACT_ADDRESS || !RPC_URL) return { exists: false, identityHash: null, registeredAt: null };
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const [exists, identityHash, registeredAt] = await contract.verifyFarmer(farmerId);
    return { exists, identityHash: identityHash as string, registeredAt: new Date(Number(registeredAt) * 1000).toLocaleDateString('en-IN') };
  } catch (err: any) {
    return { exists: false, identityHash: null, registeredAt: null };
  }
}