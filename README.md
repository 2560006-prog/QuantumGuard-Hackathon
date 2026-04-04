# 🌾 QuantumGuard — Blockchain Farmer Identity System

> Blockchain-powered digital identity platform for Indian farmers built on Ethereum Sepolia Testnet

🌐 **Live Demo:** https://quantum-guard-hackathon.vercel.app
⛓️ **Contract:** https://sepolia.etherscan.io/address/0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379

---

## 🚀 Problem Statement

Over 140 million Indian farmers lack verifiable digital identities, making it difficult to access government schemes, loans, and banking services. Paper documents are easily forged, lost, or tampered with.

---

## 💡 Solution

QuantumGuard creates a blockchain-anchored digital identity for each farmer combining:

- Ethereum smart contracts for immutable identity registration
- Supabase for real-time database and document storage
- IPFS via Pinata for decentralized file storage
- QR-based verification for instant bank verification
- Multi-role system for farmer, validator, and admin portals

---

## 🛠️ Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (email/password) |

### Backend

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express.js |
| Database | PostgreSQL (Supabase) + MongoDB (Atlas) |
| ORM | Mongoose |
| File Upload | Multer + IPFS via Pinata |

### Blockchain

| Layer | Technology |
|-------|-----------|
| Platform | Ethereum Sepolia Testnet |
| Language | Solidity 0.8.20 |
| Framework | Hardhat |
| Library | Ethers.js |

### Security

| Layer | Technology |
|-------|-----------|
| Auth Tokens | JWT (JSON Web Tokens) |
| Passwords | bcrypt hashing |
| Sensitive Data | crypto-js AES encryption |
| Identity | Aadhaar OTP Verification |

---

## ⛓️ Smart Contract

- **Contract:** FarmerIdentity.sol
- **Network:** Ethereum Sepolia Testnet
- **Address:** `0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379`
- **Features:** Register farmer, verify identity, IPFS document hash, validator support

---

## 📁 Project Structure

```
QuantumGuard-Hackathon/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/               # Login page
│   │   │   └── register/            # 4-step farmer registration
│   │   ├── dashboard/
│   │   │   ├── farmer/              # Farmer portal
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/         # Profile form
│   │   │   │   ├── documents/       # Document upload + Aadhaar OTP
│   │   │   │   └── status/          # Verification status
│   │   │   ├── validator/           # Validator portal
│   │   │   │   ├── page.tsx
│   │   │   │   └── farmers/[id]/    # Farmer detail + review
│   │   │   └── admin/               # Admin portal
│   │   │       ├── page.tsx
│   │   │       ├── farmers/         # All farmers + management
│   │   │       ├── validators/      # Validator management
│   │   │       ├── analytics/       # Stats and charts
│   │   │       └── settings/        # Admin settings
│   │   ├── api/
│   │   │   ├── aadhaar/
│   │   │   │   ├── send-otp/        # Generate OTP
│   │   │   │   └── verify-otp/      # Verify OTP
│   │   │   ├── blockchain/
│   │   │   │   ├── register/        # Register on Ethereum
│   │   │   │   └── register-existing/
│   │   │   └── contact/             # Contact form API
│   │   └── farmer/[id]/             # Public QR scan page
│   ├── components/
│   │   ├── shared/                  # Sidebar, StatusBadge, StatCard
│   │   ├── validator/               # ValidatorReviewForm, DocumentViewer
│   │   └── admin/                   # AdminFarmerActions, AdminValidatorManager
│   ├── contracts/
│   │   └── FarmerIdentity.sol       # Solidity smart contract
│   ├── lib/
│   │   ├── supabase/                # client.ts, server.ts, middleware.ts
│   │   ├── blockchain.ts            # ethers.js contract interaction
│   │   └── FarmerIdentityABI.json   # Contract ABI
│   └── types/
│       └── index.ts                 # TypeScript definitions
├── blockchain/
│   ├── contracts/FarmerIdentity.sol
│   ├── scripts/deploy.js
│   └── hardhat.config.js
└── database/
    └── schema.sql                   # Full PostgreSQL schema
```

---

## ⚙️ Setup and Installation

### Option A — Next.js Frontend (Supabase)

```bash
git clone https://github.com/2560006-prog/QuantumGuard-Hackathon.git
cd QuantumGuard-Hackathon
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_CONTRACT_ADDRESS=0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379
CONTRACT_ADDRESS=0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
DEPLOYER_PRIVATE_KEY=your-wallet-private-key
```

### Option B — Node.js Backend (MongoDB)

```bash
npm install
cp .env.example .env
node server.js
```

Fill in `.env`:

```env
MONGO_URI=mongodb+srv://...
PINATA_API_KEY=your-pinata-key
PINATA_SECRET_KEY=your-pinata-secret
ALCHEMY_RPC=https://eth-sepolia.g.alchemy.com/v2/your-key
PRIVATE_KEY=your-metamask-private-key
CONTRACT_ADDRESS=0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379
```

### Deploy Smart Contract

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

---

## 🔐 Role-Based Access

| Feature | Farmer | Validator | Admin |
|---------|--------|-----------|-------|
| Submit profile | ✅ | ❌ | ❌ |
| Upload documents | ✅ | ❌ | ❌ |
| Aadhaar OTP verify | ✅ | ❌ | ❌ |
| View own status | ✅ | ❌ | ❌ |
| View all farmers | ❌ | ✅ | ✅ |
| Approve / Reject | ❌ | ✅ | ✅ |
| Assign validators | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ |

---

## 🗄️ Database Schema

```
auth.users (Supabase)
    │
    ▼
public.users
    │
    ├── farmer_profiles
    │       │
    │       ├── documents
    │       ├── verification_status
    │       └── aadhaar_verifications
    │
    ├── contact_messages
    ├── notifications
    └── activity_logs
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new farmer |
| POST | `/api/auth/login` | Login with credentials |
| GET | `/api/farmer/profile` | Get farmer profile |
| GET | `/api/farmer/loan-eligibility` | Check loan eligibility score |
| POST | `/api/aadhaar/send-otp` | Generate Aadhaar OTP |
| POST | `/api/aadhaar/verify-otp` | Verify Aadhaar OTP |
| POST | `/api/documents/upload` | Upload doc to IPFS + Supabase |
| POST | `/api/blockchain/register` | Register identity on Ethereum |
| GET | `/api/blockchain/verify/:hash` | Verify hash on chain |
| POST | `/api/contact` | Submit contact form |

---

## 📦 Storage

| Storage | Type | Contents |
|---------|------|----------|
| Supabase Storage | Cloud | Profile photos, documents |
| IPFS via Pinata | Decentralized | Permanent document storage |

---

## 🎯 Key Features

- ⛓️ Blockchain identity on Ethereum Sepolia
- 🪪 Aadhaar OTP verification before document upload
- 📁 One-file-per-slot document management with 5MB validation
- 📱 QR identity card for instant bank verification
- ✅ Validator review and approval system
- 🛡️ Admin management portal with analytics
- 🏛️ 8+ government scheme listings
- 💰 Loan eligibility calculator
- 🔐 AES-256 encryption for sensitive data
- 🌐 IPFS decentralized file storage

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
npm run lint     # ESLint check
node server.js   # Node.js backend server
```

---

## 👥 Team

- Shruti Dabade — Operational Lead
- Anuja Sathe — Technical Lead
- Megha Desai — Performance Lead
- Sankashti Chougale — Research and Documentation Lead
