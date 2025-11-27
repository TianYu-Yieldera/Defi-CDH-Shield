# CDP Shield Smart Contracts

Smart contract infrastructure for CDP Shield protocol on BASE chain.

## Project Structure

```
contracts/
├── contracts/
│   ├── core/              # Main protocol contracts (TBD)
│   ├── interfaces/        # Contract interfaces
│   │   ├── ICDPShield.sol
│   │   ├── IDEXAggregator.sol
│   │   ├── IFlashLoanReceiver.sol
│   │   └── IPriceOracle.sol
│   └── mocks/            # Mock contracts for testing
│       ├── MockERC20.sol
│       └── MockPriceOracle.sol
├── scripts/              # Deployment scripts
│   ├── deploy.ts
│   └── deployMockTokens.ts
├── test/                # Contract tests
│   ├── MockERC20.test.ts
│   └── MockPriceOracle.test.ts
└── deployments/         # Deployment addresses
    └── baseSepolia.json
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
# RPC URLs
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org

# Private Key (DO NOT commit real private key)
PRIVATE_KEY=your_private_key_here

# Basescan API Key for contract verification
BASESCAN_API_KEY=your_basescan_api_key

# Gas Reporter
REPORT_GAS=false
COINMARKETCAP_API_KEY=your_cmc_api_key
```

### 3. Get Test ETH

Visit the BASE Sepolia faucet:
- https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 4. Compile Contracts

```bash
npm run compile
```

### 5. Run Tests

```bash
npm test
```

## Available Scripts

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with gas reporting
npm run gas-report

# Run coverage
npm run coverage

# Deploy to local network
npm run deploy:local

# Deploy mock tokens to BASE Sepolia
npm run deploy:mocks

# Deploy main contracts to BASE Sepolia
npm run deploy:sepolia

# Verify contracts on Basescan
npm run verify
```

## Mock Tokens

Mock ERC20 tokens with built-in faucet functionality for testing.

### Features

- **Faucet**: Anyone can mint tokens up to daily limit
- **Daily Limits**:
  - MockUSDC: 10,000 USDC/day
  - MockWETH: 10 WETH/day
  - MockDAI: 10,000 DAI/day
- **Reset**: Daily limit resets after 24 hours

### Deploy Mock Tokens

```bash
npm run deploy:mocks
```

### Use Faucet

After deployment, users can call the `faucet()` function to mint tokens:

```javascript
// Using ethers.js
const mockUSDC = await ethers.getContractAt("MockERC20", usdcAddress);
await mockUSDC.faucet();
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test

```bash
npx hardhat test test/MockERC20.test.ts
```

### Gas Report

```bash
npm run gas-report
```

### Coverage

```bash
npm run coverage
```

## Contract Interfaces

### ICDPShield

Main interface for CDP position management:

- `registerPosition()` - Register a new CDP position
- `reduceLeverage()` - Reduce leverage by repaying debt
- `partialClose()` - Close part of a position
- `fullClose()` - Close entire position
- `emergencyClose()` - Emergency close when at high risk
- `updatePosition()` - Update position data
- `getPosition()` - Get position details
- `calculateHealthFactor()` - Calculate health factor

### IDEXAggregator

DEX aggregation interface:

- `swap()` - Execute swap on best DEX
- `swapWithRoute()` - Execute swap with specific route
- `getBestQuote()` - Get best quote from all DEXs
- `getQuotes()` - Get quotes from multiple DEXs
- `addDEX()` - Add allowed DEX
- `removeDEX()` - Remove DEX

### IPriceOracle

Price feed interface:

- `getPrice()` - Get token price in USD
- `getPrices()` - Get multiple token prices
- `isPriceStale()` - Check if price is stale
- `getLastUpdate()` - Get last update timestamp

## Configuration

### Hardhat Config

The project is configured for:

- **Solidity**: 0.8.24
- **Optimizer**: Enabled (200 runs)
- **Networks**:
  - Hardhat (local)
  - BASE Sepolia (testnet)
  - BASE (mainnet)

### Gas Reporter

Enable gas reporting by setting:

```env
REPORT_GAS=true
```

### Contract Verification

Verify contracts on Basescan after deployment:

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Deployment

### BASE Sepolia Testnet

1. Get test ETH from faucet
2. Set `PRIVATE_KEY` in `.env`
3. Deploy:

```bash
npm run deploy:mocks
```

4. Addresses will be saved to `deployments/baseSepolia.json`

## Security Features

- OpenZeppelin contracts for industry-standard implementations
- ReentrancyGuard on all state-changing functions
- AccessControl for administrative operations
- Pausable mechanism for emergency stops
- Comprehensive test coverage (target: 100%)
- Security audit planned post-hackathon

## Resources

- [BASE Documentation](https://docs.base.org)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)

## Contributing

This is a hackathon project. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT
