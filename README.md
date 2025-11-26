# CDP Shield

**BASE 链上的智能化 DeFi 仓位保护协议**

CDP Shield 是一个自动化风险管理系统，专为抵押债仓（CDP）持有者设计，通过实时监控、智能预警和一键保护机制，防止清算事件发生。

---

## 核心问题

DeFi 借贷协议（Aave、Compound、MakerDAO）的用户面临清算风险，特别是在市场波动期间。现有解决方案存在以下痛点：

- 需要持续手动监控健康因子
- 紧急情况下需要多次交易确认
- 需要深入理解闪电贷和 DEX 聚合技术
- 高昂的 Gas 费用

**CDP Shield 通过自动化和批量交易消除这些摩擦点。**

---

## 技术创新

### 1. 自动仓位监控
跨多个 CDP 协议的实时健康因子计算，配合预测性清算价格分析。

### 2. 闪电贷驱动的保护机制
利用 Balancer 和 Aave 的资金高效闪电贷执行保护策略，无需预先准备流动性：

- 通过抵押品兑换降低杠杆
- 部分仓位平仓
- 紧急完全退出

### 3. 账户抽象集成
集成 Coinbase Smart Wallet 实现：

- 通过 Paymaster 实现无 Gas 交易
- 批量交易执行（单次用户确认）
- 基于邮件的紧急通知与深度链接

### 4. DEX 聚合优化
跨 BASE 生态 DEX（Uniswap V3、Aerodrome、BaseSwap）的最优路由，最小化滑点并获得最佳执行价格。

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          前端层                                  │
│  Next.js 14 | TypeScript | TailwindCSS | RainbowKit + wagmi    │
│  - Dashboard (仓位监控)                                          │
│  - Portfolio (资产分析)                                          │
│  - 预警配置                                                      │
│  - 一键保护界面                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   智能合约层 (BASE)                              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  CDPShield   │  │     DEX      │  │  FlashLoan   │         │
│  │   核心合约   │◄─┤    聚合器    │◄─┤   接收器     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                 ┌──────────▼──────────┐                         │
│                 │    价格预言机       │                         │
│                 │  (Chainlink/Pyth)   │                         │
│                 └─────────────────────┘                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    数据中台 (规划中)                             │
│  Go Indexer → Kafka → Flink (实时) → PostgreSQL + Redis        │
│  - BASE 网络事件索引                                            │
│  - 实时健康因子计算                                              │
│  - 历史分析与预警                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 智能合约接口

### ICDPShield.sol
核心仓位管理接口：
- `reduceLeverage()` - 通过闪电贷 + DEX 兑换降低杠杆
- `partialClose()` - 平仓部分仓位
- `fullClose()` - 完全平仓
- `emergencyClose()` - 健康因子危急时紧急退出
- `calculateHealthFactor()` - 实时风险计算

### IDEXAggregator.sol
多 DEX 路由优化：
- `getBestQuote()` - 查询所有 DEX 的最优兑换率
- `swap()` - 在最佳 DEX 执行兑换
- 价格影响计算与滑点保护

### IFlashLoanReceiver.sol
闪电贷回调处理器：
- Balancer Vault 集成
- Aave V3 集成
- 自动还款逻辑

---

## 安全设计

### 智能合约安全
- 所有外部调用使用 ReentrancyGuard
- 管理功能使用 AccessControl
- 断路器机制 (Pausable)
- 参数验证与滑点限制
- 基于 OpenZeppelin 经审计合约构建

### 闪电贷安全
- 闪电贷提供者白名单验证
- 回调认证（仅限 Balancer/Aave vault）
- 原子交易执行（失败回滚）
- 闪电贷状态跟踪

### 价格预言机保护
- 最大价格偏差检查（5% 阈值）
- 多预言机聚合（Chainlink + Pyth）
- 陈旧性检测（1小时新鲜度要求）

### 测试覆盖
- 单元测试：100% 覆盖率目标
- 集成测试（BASE Sepolia 分叉）
- 模糊测试 (Echidna)
- Gas 优化基准测试

---

## 技术栈

**前端**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- wagmi v2 + RainbowKit
- Coinbase Wallet SDK (Smart Wallet)
- Recharts (数据可视化)

**智能合约**
- Solidity 0.8.24
- Hardhat 开发环境
- OpenZeppelin Contracts
- Chainlink Price Feeds
- Balancer V2 Flash Loans

**基础设施** (规划中)
- Go (事件索引服务)
- Apache Flink (实时计算)
- PostgreSQL (分析存储)
- Redis (缓存层)
- Kafka (事件流)

**网络**
- BASE (以太坊 L2, OP Stack)
- BASE Sepolia (测试网部署)

---

## 当前开发进度

**阶段 1: 基础设施** (已完成)

- [x] 智能合约接口 (ICDPShield, IDEXAggregator, IFlashLoanReceiver, IPriceOracle)
- [x] Mock 合约 (带 Faucet 的 MockERC20, MockPriceOracle)
- [x] 前端 Dashboard 与钱包集成
- [x] 批量交易支持 (Smart Wallet)
- [x] BASE Name 解析与显示
- [x] Toast 通知系统
- [x] CI/CD 流水线 (GitHub Actions)

**阶段 2: 核心实现** (进行中)

- [ ] CDPShield 主合约
- [ ] DEXAggregator 实现
- [ ] 闪电贷集成
- [ ] 价格预言机设置 (Chainlink 集成)
- [ ] 全面测试套件

**阶段 3: 数据层** (规划中)

- [ ] 基于 Go 的事件索引器
- [ ] 实时计算流水线
- [ ] 预警通知服务（邮件通过 Resend）
- [ ] 历史分析 Dashboard

---

## 快速开始

### 前置要求
- Node.js 18+
- npm 或 pnpm
- Git

### 前端设置

```bash
cd frontend
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加 WalletConnect Project ID

npm run dev
# 访问 http://localhost:3000
```

### 智能合约设置

```bash
cd contracts
npm install

# 配置环境
cp .env.example .env
# 添加 BASE_SEPOLIA_RPC_URL 和 PRIVATE_KEY

# 编译合约
npm run compile

# 运行测试
npm test

# 部署到 BASE Sepolia
npm run deploy:mocks
```

---

## 测试

### 前端
```bash
cd frontend
npm run lint          # ESLint 检查
npm run type-check    # TypeScript 验证
npm run build         # 生产构建测试
```

### 智能合约
```bash
cd contracts
npm test              # 运行所有测试
npm run coverage      # 生成覆盖率报告
npm run gas-report    # Gas 消耗分析
```

---

## 部署地址 (BASE Sepolia)

测试网合约部署于：

```
MockUSDC:         [待部署]
MockWETH:         [待部署]
MockDAI:          [待部署]
MockPriceOracle:  [待部署]
CDPShield:        [开发中]
DEXAggregator:    [开发中]
```

已在 [BASE Sepolia Explorer](https://sepolia.basescan.org/) 验证

---

## 发展路线图

**黑客松 Demo** (当前重点)
- 完成核心合约实现
- 部署到 BASE Sepolia 测试网
- 功能性前端 Demo (Mock CDP 仓位)
- 一键保护演示

**后续计划**
- 外部安全审计
- BASE 主网部署
- 集成 Moonwell, Compound 协议
- 实时数据索引基础设施
- 移动端响应式 PWA

**未来增强**
- 多链支持 (Optimism, Arbitrum)
- 高级风险模型 (ML 预测)
- 社交交易功能（复制保护策略）
- DAO 治理协议参数

---

## 使用场景

### 1. 个人 CDP 持有者
保护个人在 Aave/Compound 的杠杆仓位，无需持续监控。

### 2. DeFi 资产管理人
通过集中式风险 Dashboard 和自动化保护管理多个客户仓位。

### 3. 机构借款人
机构级风险管理，可自定义健康因子阈值和即时通知。

---

## 核心优势

### 技术层面
- **零知识门槛**: 普通用户无需理解闪电贷、DEX 聚合等复杂概念
- **资金高效**: 通过闪电贷实现无需预先准备流动性的保护
- **最优执行**: DEX 聚合器确保最佳兑换价格
- **批量操作**: Smart Wallet 支持单次确认多笔交易

### 商业层面
- **降低清算损失**: 帮助用户避免 10-15% 的清算罚金
- **提升用户留存**: 为 CDP 协议提供增值服务
- **市场规模**: BASE 上 Moonwell TVL > $500M，潜在用户群庞大
- **可持续性**: 通过 DEX 聚合价差和订阅模式实现收入

---

## 项目亮点

### 1. 实际解决痛点
不是概念性产品，而是解决 DeFi 用户真实面临的清算风险问题。

### 2. 技术集成度高
- BASE 原生 (L2 低 Gas)
- Coinbase Smart Wallet (AA 账户抽象)
- BASE Name Service (身份系统)
- 闪电贷 + DEX 聚合 (DeFi 乐高)

### 3. 完整的产品闭环
从监控、预警到执行的完整用户体验，不仅仅是工具集合。

### 4. 可扩展架构
数据中台设计支持未来扩展到多链、多协议、高级分析功能。

---

## 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 致谢

构建于 BASE (Coinbase L2) 并使用：
- Coinbase Smart Wallet 实现账户抽象
- BASE Name Service 提供身份服务
- BASE 生态 DEX 提供流动性
- Chainlink 提供可靠的价格数据

---

**开发时间: 2025**
