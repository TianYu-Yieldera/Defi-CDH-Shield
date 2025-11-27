# CDP Shield

**Intelligent DeFi Position Protection Protocol on BASE**

CDP Shield is an automated risk management system designed to protect Collateralized Debt Position (CDP) holders from liquidation events through real-time monitoring, intelligent alerting, and seamless one-click protection mechanisms.

---

## Problem Statement

DeFi CDP protocols (Aave, Compound, MakerDAO) expose users to liquidation risks during market volatility. Current solutions require:

- Constant manual monitoring of health factors
- Multiple transaction approvals during emergencies
- Technical knowledge of flash loans and DEX aggregation
- High gas costs for position adjustments

**CDP Shield eliminates these friction points through automation and intelligent batching.**

---

## Core Innovation

### 1. Automated Position Monitoring
Real-time health factor calculation across multiple CDP protocols with predictive liquidation price analysis.

### 2. Flash Loan-Powered Protection
Leverage capital-efficient flash loans from Balancer and Aave to execute protection strategies without requiring upfront liquidity:

- Reduce leverage through collateral swaps
- Partial position unwinding
- Emergency full closure

### 3. Account Abstraction Integration
Coinbase Smart Wallet integration enables:

- Gasless transactions via Paymaster
- Batch transaction execution (single user confirmation)
- Email-based emergency notifications with deep links

### 4. DEX Aggregation
Optimal swap routing across BASE ecosystem DEXs (Uniswap V3, Aerodrome, BaseSwap) for minimal slippage and best execution.

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  Next.js 14 | TypeScript | TailwindCSS | RainbowKit + wagmi    │
│  - Dashboard (Position Monitoring)                              │
│  - Portfolio Analytics                                          │
│  - Alert Configuration                                          │
│  - One-Click Protection Interface                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Smart Contract Layer (BASE)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  CDPShield   │  │     DEX      │  │  FlashLoan   │         │
│  │   Core       │◄─┤  Aggregator  │◄─┤   Receiver   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                 ┌──────────▼──────────┐                         │
│                 │   Price Oracle      │                         │
│                 │  (Chainlink/Pyth)   │                         │
│                 └─────────────────────┘                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Platform (Future)                       │
│  Go Indexer → Kafka → Flink (Real-time) → PostgreSQL + Redis   │
│  - Event indexing from BASE network                             │
│  - Real-time health factor computation                          │
│  - Historical analytics and alerting                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Interfaces

### ICDPShield.sol
Core position management interface:
- `reduceLeverage()` - Reduce position leverage via flash loan + DEX swap
- `partialClose()` - Close percentage of position
- `fullClose()` - Complete position liquidation
- `emergencyClose()` - Emergency exit when health factor critical
- `calculateHealthFactor()` - Real-time risk calculation

### IDEXAggregator.sol
Multi-DEX routing optimization:
- `getBestQuote()` - Query optimal swap rates across all DEXs
- `swap()` - Execute swap on best available DEX
- Price impact calculation and slippage protection

### IFlashLoanReceiver.sol
Flash loan callback handlers for:
- Balancer Vault integration
- Aave V3 integration
- Automated repayment logic

---

## Security Design

### Smart Contract Security
- ReentrancyGuard on all external calls
- AccessControl for administrative functions
- Pausable circuit breaker mechanism
- Parameter validation and slippage limits
- OpenZeppelin audited contracts as foundation

### Flash Loan Safety
- Whitelist validation for flash loan providers
- Callback authentication (only Balancer/Aave vaults)
- Atomic transaction execution (revert on failure)
- Flash loan state tracking

### Price Oracle Protection
- Maximum price deviation checks (5% threshold)
- Multi-oracle aggregation (Chainlink + Pyth)
- Staleness detection (1-hour freshness requirement)

### Test Coverage
- Unit tests: 100% coverage target
- Integration tests with forked BASE Sepolia
- Fuzzing tests (Echidna)
- Gas optimization benchmarks

---

## Technology Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- wagmi v2 + RainbowKit
- Coinbase Wallet SDK (Smart Wallet)
- Recharts (Analytics visualization)

**Smart Contracts**
- Solidity 0.8.24
- Hardhat development environment
- OpenZeppelin Contracts
- Chainlink Price Feeds
- Balancer V2 Flash Loans

**Infrastructure** (Planned)
- Go (Event indexing service)
- Apache Flink (Real-time computation)
- PostgreSQL (Analytical storage)
- Redis (Cache layer)
- Kafka (Event streaming)

**Network**
- BASE (L2 Ethereum, OP Stack)
- BASE Sepolia (Testnet deployment)

---

## Current Development Status

**Phase 1: Foundation** (Completed)

- ✓ Smart contract interfaces (ICDPShield, IDEXAggregator, IFlashLoanReceiver, IPriceOracle)
- ✓ Mock contracts (MockERC20 with faucet, MockPriceOracle)
- ✓ Frontend dashboard with wallet integration
- ✓ Batch transaction support (Smart Wallet)
- ✓ BASE Name resolution and display
- ✓ Toast notification system

**Phase 2: Core Implementation** (In Progress)

- [ ] CDPShield main contract
- [ ] DEXAggregator implementation
- [ ] Flash loan integration
- [ ] Price oracle setup (Chainlink integration)
- [ ] Comprehensive test suite

**Phase 3: Data Layer** (Planned)

- [ ] Go-based event indexer
- [ ] Real-time computation pipeline
- [ ] Alert notification service (Email via Resend)
- [ ] Historical analytics dashboard

---

## Installation and Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Git

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your WalletConnect Project ID

npm run dev
# Access at http://localhost:3000
```

### Smart Contracts Setup

```bash
cd contracts
npm install

# Configure environment
cp .env.example .env
# Add BASE_SEPOLIA_RPC_URL and PRIVATE_KEY

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to BASE Sepolia
npm run deploy:mocks
```

---

## Testing

### Frontend
```bash
cd frontend
npm run lint          # ESLint checks
npm run type-check    # TypeScript validation
npm run build         # Production build test
```

### Smart Contracts
```bash
cd contracts
npm test              # Run all tests
npm run coverage      # Generate coverage report
npm run gas-report    # Gas consumption analysis
```

---

## Deployment Addresses (BASE Sepolia)

Testnet contracts are deployed at:

```
MockUSDC:         [Pending deployment]
MockWETH:         [Pending deployment]
MockDAI:          [Pending deployment]
MockPriceOracle:  [Pending deployment]
CDPShield:        [Under development]
DEXAggregator:    [Under development]
```

Verified on [BASE Sepolia Explorer](https://sepolia.basescan.org/)

---

## Roadmap

**Hackathon Demo** (Current Focus)
- Complete core contract implementation
- Deploy to BASE Sepolia testnet
- Functional frontend demo with mock CDP positions
- One-click protection demonstration

**Post-Hackathon**
- External security audit
- Mainnet deployment on BASE
- Integration with Moonwell, Compound protocols
- Real-time data indexing infrastructure
- Mobile-responsive PWA

**Future Enhancements**
- Multi-chain support (Optimism, Arbitrum)
- Advanced risk modeling (ML-based predictions)
- Social trading features (copy protection strategies)
- DAO governance for protocol parameters

---

## Use Cases

### 1. Individual CDP Holders
Protect personal leveraged positions on Aave/Compound without constant monitoring.

### 2. DeFi Portfolio Managers
Manage multiple client positions with centralized risk dashboard and automated protection.

### 3. Institutional Borrowers
Institutional-grade risk management with customizable health factor thresholds and instant notifications.

---

## Acknowledgments

Built on BASE (Coinbase L2) leveraging:
- Coinbase Smart Wallet for account abstraction
- BASE Name Service for identity
- BASE ecosystem DEXs for liquidity
- Chainlink for reliable price feeds

---

**Developed in 2025**
