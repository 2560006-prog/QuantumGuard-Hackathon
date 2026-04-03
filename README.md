# 🌾 QuantumGuard — Blockchain Farmer Identity System

> Blockchain-powered digital identity platform for Indian farmers on Ethereum Sepolia Testnet

🌐 **Live Demo:** https://quantum-guard-hackathon-9smz.vercel.app

---

## 🚀 Problem Statement

Over 140 million Indian farmers lack verifiable digital identities, making it difficult to access government schemes, loans, and banking services. Paper documents are easily forged, lost, or tampered with.

---

## 💡 Solution

QuantumGuard creates a blockchain-anchored digital identity for each farmer combining:
- Ethereum smart contracts for immutable identity registration
- Supabase for real-time database and document storage
- QR-based verification for instant bank verification
- Multi-role system for farmer, validator, and admin portals

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Supabase (Auth, DB, Storage) |
| Database | PostgreSQL (via Supabase) |
| Blockchain | Solidity + Hardhat + Ethereum Sepolia |
| Integration | ethers.js + Infura RPC |
| Identity | Aadhaar OTP Verification |

---

## ⛓️ Smart Contract

- **Contract:** FarmerIdentity.sol
- **Network:** Ethereum Sepolia Testnet
- **Address:** `0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379`
- **Etherscan:** https://sepolia.etherscan.io/address/0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379

---

## 📁 Project Structure
src/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   └── register/       # Farmer registration
│   ├── dashboard/
│   │   ├── farmer/         # Farmer portal
│   │   │   ├── page.tsx
│   │   │   ├── documents/  # Document upload + Aadhaar OTP
│   │   │   ├── profile/    # Profile form
│   │   │   └── status/     # Verification status
│   │   ├── validator/      # Validator portal
│   │   └── admin/          # Admin portal
│   ├── api/
│   │   ├── aadhaar/        # OTP send + verify
│   │   └── blockchain/     # Ethereum registration
│   └── farmer/[id]/        # Public QR scan page
├── components/
│   ├── shared/
│   ├── validator/
│   └── admin/
├── lib/
│   ├── supabase/
│   ├── blockchain.ts
│   └── FarmerIdentityABI.json
└── types/
blockchain/
├── contracts/FarmerIdentity.sol
├── scripts/deploy.js
└── hardhat.config.js
database/
└── schema.sql

---

## ⚙️ Setup Instructions

**1. Clone the repo**
```bash
git clone https://github.com/2560006-prog/QuantumGuard-Hackathon.git
cd QuantumGuard-Hackathon
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment**
```bash
cp .env.example .env.local
# Fill in your Supabase and blockchain credentials
```

**4. Run database schema**
- Go to Supabase dashboard → SQL Editor
- Paste and run `database/schema.sql`

**5. Start development server**
```bash
npm run dev
```

---

## 🔐 Role-Based Access

| Feature | Farmer | Validator | Admin |
|---------|--------|-----------|-------|
| Submit profile | ✅ | ❌ | ❌ |
| Upload documents | ✅ | ❌ | ❌ |
| Aadhaar OTP verify | ✅ | ❌ | ❌ |
| View own status | ✅ | ❌ | ❌ |
| Review farmers | ❌ | ✅ | ✅ |
| Approve/Reject | ❌ | ✅ | ✅ |
| Assign validators | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ |

---

## 🗄️ Database Schema
auth.users (Supabase)
│
▼
public.users           ← role, profile info
│
├── farmer_profiles      ← personal, farm, bank, blockchain data
│       │
│       ├── documents           ← file uploads
│       └── verification_status ← pending/approved/rejected
│
└── aadhaar_verifications  ← OTP records

---

## 🎯 Key Features

- ⛓️ Blockchain identity on Ethereum Sepolia
- 🪪 Aadhaar OTP verification
- 📄 Document upload with validation
- 📱 QR identity card for banks
- ✅ Validator review system
- 🛡️ Admin management portal
- 🏛️ 8+ government schemes
- 💰 Loan eligibility calculator

---

## 👥 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 🛡️ Admin | admin@quantumguard.com | Admin@123 |
| ✅ Validator | validator@quantumguard.com | Validator@123 |
| 🌾 Farmer | farmer@quantumguard.com | Farmer@123 |

---

## 🔧 Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
```

---

## 👥 Team

- Shruti Dabade — Operational Lead
- Anuja Sathe — Technical Lead
- Megha Desai — Performance Lead
- Sankashti Chougale — Research and Documentation Lead
bashgit add README.md
git commit -m "Add complete README with structure, setup guide, role table and live demo link"
git push