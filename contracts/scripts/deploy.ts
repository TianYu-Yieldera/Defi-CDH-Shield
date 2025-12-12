import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
    network: string;
    chainId: number;
    deployedAt: string;
    deployer: string;
    contracts: {
        MockWETH?: string;
        MockUSDC?: string;
        MockDAI?: string;
        MockPriceOracle?: string;
        MockDEXAggregator?: string;
        MockAavePool?: string;
        CDPShield?: string;
        FlashLoanReceiver?: string;
    };
}

async function main() {
    console.log("=".repeat(60));
    console.log("CDP Shield - Full Deployment Script");
    console.log("=".repeat(60));

    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        console.error("\nError: No signers available. Please check your PRIVATE_KEY in .env");
        process.exit(1);
    }
    const deployer = signers[0];
    console.log("\nDeployer:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.01")) {
        console.error("\nError: Insufficient balance. Need at least 0.01 ETH for deployment.");
        process.exit(1);
    }

    const networkName = network.name;
    const chainId = (await ethers.provider.getNetwork()).chainId;
    console.log("Network:", networkName);
    console.log("Chain ID:", chainId);
    console.log("-".repeat(60));

    const addresses: DeploymentAddresses = {
        network: networkName,
        chainId: Number(chainId),
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {}
    };

    // Constants
    const INITIAL_SUPPLY = ethers.parseEther("1000000");
    const DAILY_MINT_LIMIT = ethers.parseEther("10000");
    const WETH_PRICE = ethers.parseEther("2000"); // $2000
    const USDC_PRICE = ethers.parseEther("1"); // $1
    const DAI_PRICE = ethers.parseEther("1"); // $1
    const EXCHANGE_RATE = ethers.parseEther("2000"); // 1 WETH = 2000 USDC

    try {
        // 1. Deploy Mock Tokens
        console.log("\n[1/8] Deploying MockWETH...");
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        const mockWETH = await MockERC20Factory.deploy(
            "Wrapped Ether",
            "WETH",
            18,
            INITIAL_SUPPLY,
            DAILY_MINT_LIMIT
        );
        await mockWETH.waitForDeployment();
        addresses.contracts.MockWETH = await mockWETH.getAddress();
        console.log("  MockWETH:", addresses.contracts.MockWETH);

        console.log("\n[2/8] Deploying MockUSDC...");
        const mockUSDC = await MockERC20Factory.deploy(
            "USD Coin",
            "USDC",
            6, // USDC has 6 decimals
            ethers.parseUnits("1000000", 6),
            ethers.parseUnits("10000", 6)
        );
        await mockUSDC.waitForDeployment();
        addresses.contracts.MockUSDC = await mockUSDC.getAddress();
        console.log("  MockUSDC:", addresses.contracts.MockUSDC);

        console.log("\n[3/8] Deploying MockDAI...");
        const mockDAI = await MockERC20Factory.deploy(
            "Dai Stablecoin",
            "DAI",
            18,
            INITIAL_SUPPLY,
            DAILY_MINT_LIMIT
        );
        await mockDAI.waitForDeployment();
        addresses.contracts.MockDAI = await mockDAI.getAddress();
        console.log("  MockDAI:", addresses.contracts.MockDAI);

        // 2. Deploy Mock Price Oracle
        console.log("\n[4/8] Deploying MockPriceOracle...");
        const MockPriceOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        const priceOracle = await MockPriceOracleFactory.deploy();
        await priceOracle.waitForDeployment();
        addresses.contracts.MockPriceOracle = await priceOracle.getAddress();
        console.log("  MockPriceOracle:", addresses.contracts.MockPriceOracle);

        // Set prices
        console.log("  Setting prices...");
        await priceOracle.setPrice(addresses.contracts.MockWETH, WETH_PRICE);
        await priceOracle.setPrice(addresses.contracts.MockUSDC, USDC_PRICE);
        await priceOracle.setPrice(addresses.contracts.MockDAI, DAI_PRICE);
        console.log("  Prices set: WETH=$2000, USDC=$1, DAI=$1");

        // 3. Deploy Mock DEX Aggregator
        console.log("\n[5/8] Deploying MockDEXAggregator...");
        const MockDEXAggregatorFactory = await ethers.getContractFactory("MockDEXAggregator");
        const dexAggregator = await MockDEXAggregatorFactory.deploy();
        await dexAggregator.waitForDeployment();
        addresses.contracts.MockDEXAggregator = await dexAggregator.getAddress();
        console.log("  MockDEXAggregator:", addresses.contracts.MockDEXAggregator);

        // Configure DEX
        console.log("  Configuring DEX...");
        await dexAggregator.addAllowedToken(addresses.contracts.MockWETH);
        await dexAggregator.addAllowedToken(addresses.contracts.MockUSDC);
        await dexAggregator.addAllowedToken(addresses.contracts.MockDAI);
        await dexAggregator.setExchangeRate(
            addresses.contracts.MockWETH,
            addresses.contracts.MockUSDC,
            EXCHANGE_RATE
        );
        console.log("  DEX configured: WETH/USDC rate = 2000");

        // Fund DEX with liquidity
        console.log("  Funding DEX with liquidity...");
        await mockUSDC.transfer(
            addresses.contracts.MockDEXAggregator,
            ethers.parseUnits("500000", 6)
        );
        console.log("  DEX funded with 500,000 USDC");

        // 4. Deploy Mock Aave Pool
        console.log("\n[6/8] Deploying MockAavePool...");
        const MockAavePoolFactory = await ethers.getContractFactory("MockAavePool");
        const aavePool = await MockAavePoolFactory.deploy();
        await aavePool.waitForDeployment();
        addresses.contracts.MockAavePool = await aavePool.getAddress();
        console.log("  MockAavePool:", addresses.contracts.MockAavePool);

        // Fund Aave Pool
        console.log("  Funding Aave Pool...");
        await mockUSDC.transfer(
            addresses.contracts.MockAavePool,
            ethers.parseUnits("100000", 6)
        );
        console.log("  Aave Pool funded with 100,000 USDC");

        // 5. Deploy CDPShield
        console.log("\n[7/8] Deploying CDPShield...");
        const CDPShieldFactory = await ethers.getContractFactory("CDPShield");
        const cdpShield = await CDPShieldFactory.deploy(
            addresses.contracts.MockPriceOracle,
            addresses.contracts.MockDEXAggregator
        );
        await cdpShield.waitForDeployment();
        addresses.contracts.CDPShield = await cdpShield.getAddress();
        console.log("  CDPShield:", addresses.contracts.CDPShield);

        // 6. Deploy FlashLoanReceiver
        console.log("\n[8/8] Deploying FlashLoanReceiver...");
        const FlashLoanReceiverFactory = await ethers.getContractFactory("FlashLoanReceiver");
        const flashLoanReceiver = await FlashLoanReceiverFactory.deploy(
            addresses.contracts.MockAavePool,
            addresses.contracts.CDPShield,
            addresses.contracts.MockDEXAggregator
        );
        await flashLoanReceiver.waitForDeployment();
        addresses.contracts.FlashLoanReceiver = await flashLoanReceiver.getAddress();
        console.log("  FlashLoanReceiver:", addresses.contracts.FlashLoanReceiver);

        // 7. Configure CDPShield with flash loan components
        console.log("\n[Config] Configuring CDPShield...");
        await cdpShield.setAavePool(addresses.contracts.MockAavePool);
        await cdpShield.setFlashLoanReceiver(addresses.contracts.FlashLoanReceiver);
        console.log("  CDPShield configured with Aave Pool and FlashLoanReceiver");

        // Save deployment addresses
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const filePath = path.join(deploymentsDir, `${networkName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
        console.log("\n" + "=".repeat(60));
        console.log("Deployment Complete!");
        console.log("=".repeat(60));
        console.log("\nAddresses saved to:", filePath);

        // Print summary
        console.log("\n--- Contract Addresses ---");
        Object.entries(addresses.contracts).forEach(([name, addr]) => {
            console.log(`${name}: ${addr}`);
        });

        // Print verification commands
        console.log("\n--- Verification Commands ---");
        console.log(`\nnpx hardhat verify --network ${networkName} ${addresses.contracts.CDPShield} ${addresses.contracts.MockPriceOracle} ${addresses.contracts.MockDEXAggregator}`);
        console.log(`\nnpx hardhat verify --network ${networkName} ${addresses.contracts.FlashLoanReceiver} ${addresses.contracts.MockAavePool} ${addresses.contracts.CDPShield} ${addresses.contracts.MockDEXAggregator}`);

    } catch (error) {
        console.error("\nDeployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
