# CDP Shield Frontend

A modern Web3 frontend application for monitoring and protecting CDP (Collateralized Debt Position) positions on BASE chain.

## Features

- **Real-time CDP Monitoring**: Track your collateralized debt positions across multiple DeFi protocols
- **Portfolio Dashboard**: Comprehensive view of all your assets on BASE chain
- **Risk Alerts**: Get notified when your positions are at risk
- **Base Name Integration**: Display and resolve Base Name (ENS on BASE)
- **Smart Wallet Support**: Coinbase Smart Wallet with passkey authentication
- **Traditional Wallet Support**: MetaMask, WalletConnect, and more via RainbowKit

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Web3**: wagmi v2 + RainbowKit + viem
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

Get your WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Dashboard home page
│   ├── portfolio/         # Portfolio page
│   ├── monitor/           # Monitor settings page
│   ├── layout.tsx         # Root layout
│   ├── providers.tsx      # Web3 providers setup
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── portfolio/        # Portfolio-specific components
│   ├── base/             # Base Name related components
│   └── Header.tsx        # Main header with wallet connect
├── lib/                  # Utility functions
│   ├── wagmi.ts         # Wagmi configuration
│   ├── utils.ts         # Helper functions
│   └── mockData.ts      # Mock data for development
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
└── store/               # State management (Zustand)
```

## Key Features Implementation

### 1. Wallet Connection

The app supports multiple wallet types through RainbowKit:
- Coinbase Smart Wallet (with passkey)
- MetaMask
- WalletConnect
- Other popular wallets

### 2. CDP Monitoring

- Display health factor and risk level
- Show collateral and borrowed amounts
- Calculate liquidation prices
- Quick action buttons for emergency operations

### 3. Portfolio View

- Aggregate assets across protocols
- Visual distribution charts (pie charts, bar charts)
- Protocol and asset type breakdown
- APY and health factor tracking

### 4. Base Name Integration

- Resolve Base Names (.base.eth) to addresses
- Display Base Names instead of addresses
- Avatar support for Base Names
- Search by Base Name

### 5. Alert System

- Configure health factor thresholds
- Email notifications (requires backend)
- Browser notifications
- Real-time monitoring status

## Development

### Mock Data

The app currently uses mock data defined in `lib/mockData.ts`. This allows for frontend development without requiring a live backend.

To switch to real data:
1. Implement API client in `lib/api.ts`
2. Update components to fetch from API instead of using mock data
3. Add loading and error states

### Adding New Components

1. Create component in appropriate directory under `components/`
2. Use existing UI components from `components/ui/`
3. Follow TypeScript types defined in `types/`
4. Use utility functions from `lib/utils.ts`

### Styling

- Use TailwindCSS utility classes
- Follow the design system defined in `tailwind.config.ts`
- Use CSS variables for theming (supports dark mode)

## Build & Deploy

### Build for production:

```bash
npm run build
```

### Run production build locally:

```bash
npm start
```

### Deploy

The app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- Any platform supporting Next.js

For Vercel:
```bash
npx vercel
```

## Configuration

### Chain Configuration

Edit `lib/wagmi.ts` to configure supported chains:

```typescript
chains: [base, baseSepolia]
```

### Theme Configuration

Edit `tailwind.config.ts` to customize colors and styling.

Dark mode is supported by default.

## Roadmap

- [ ] Real API integration
- [ ] Real-time WebSocket updates
- [ ] Transaction history
- [ ] Advanced charting
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For support, please open an issue in the GitHub repository.
