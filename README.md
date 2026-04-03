# QuantumGuard — Blockchain Farmer Identity System

> Blockchain-powered digital identity platform for Indian farmers built on Ethereum Sepolia Testnet

---

## Problem Statement
Millions of farmers and rural citizens lack secure, verifiable digital identity, preventing access to financial services, government welfare schemes, credit history, and proof of land ownership due to centralized and paperwork-heavy systems.
---

## Solution

QuantumGuard creates a blockchain-anchored digital identity for each farmer by combining Ethereum smart contracts for immutable identity registration, Supabase for real-time database and document storage, QR-based verification for instant bank verification, and a multi-role system for farmer, validator, and admin portals.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Blockchain | Solidity, Hardhat, Ethereum Sepolia Testnet |
| Integration | ethers.js, Infura RPC |
| Identity | Aadhaar OTP Verification (Demo Mode) |

---

## Smart Contract

- **Contract:** FarmerIdentity.sol
- **Network:** Ethereum Sepolia Testnet
- **Address:** `0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379`
- **Verify on Etherscan:** https://sepolia.etherscan.io/address/0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379

---

## Key Features

- Blockchain identity registration on Ethereum Sepolia
- Aadhaar OTP verification before document upload
- One-file-per-slot document management
- QR identity card for instant bank verification
- Validator review and approval system
- Admin portal with full system management
- 8+ government scheme listings with eligibility
- Loan eligibility calculator based on farmer data

---

## Setup & Installation
```bash
# Clone the repo
git clone https://github.com/2560006-prog/QuantumGuard-Hackathon.git
cd QuantumGuard-Hackathon

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Fill in your Supabase and blockchain credentials

# Run development server
npm run dev
```

---

## Environment Variables

---

## Team

- Shruti Dabade - Operational Lead
- Anuja Sathe - Technical Lead
- Megha Desai - Performance Lead
- Sankashti Chougale - Research and Documentation Lead
