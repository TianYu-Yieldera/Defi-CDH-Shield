import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Mock Tokens to BASE Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy MockUSDC
  console.log("\n1. Deploying MockUSDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const mockUSDC = await MockERC20.deploy(
    "Mock USD Coin",
    "USDC",
    6, // 6 decimals like real USDC
    ethers.parseUnits("1000000", 6), // 1M USDC initial supply
    ethers.parseUnits("10000", 6) // 10,000 USDC daily faucet limit
  );

  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Deploy MockWETH
  console.log("\n2. Deploying MockWETH...");
  const mockWETH = await MockERC20.deploy(
    "Mock Wrapped Ether",
    "WETH",
    18, // 18 decimals like real WETH
    ethers.parseEther("1000"), // 1000 WETH initial supply
    ethers.parseEther("10") // 10 WETH daily faucet limit
  );

  await mockWETH.waitForDeployment();
  const wethAddress = await mockWETH.getAddress();
  console.log("✅ MockWETH deployed to:", wethAddress);

  // Deploy MockDAI
  console.log("\n3. Deploying MockDAI...");
  const mockDAI = await MockERC20.deploy(
    "Mock DAI Stablecoin",
    "DAI",
    18, // 18 decimals like real DAI
    ethers.parseEther("1000000"), // 1M DAI initial supply
    ethers.parseEther("10000") // 10,000 DAI daily faucet limit
  );

  await mockDAI.waitForDeployment();
  const daiAddress = await mockDAI.getAddress();
  console.log("✅ MockDAI deployed to:", daiAddress);

  // Deploy MockPriceOracle
  console.log("\n4. Deploying MockPriceOracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const priceOracle = await MockPriceOracle.deploy();

  await priceOracle.waitForDeployment();
  const oracleAddress = await priceOracle.getAddress();
  console.log("✅ MockPriceOracle deployed to:", oracleAddress);

  // Set initial prices (in USD with 18 decimals)
  console.log("\n5. Setting initial prices...");
  await priceOracle.setPrices(
    [usdcAddress, wethAddress, daiAddress],
    [
      ethers.parseEther("1"), // USDC = $1
      ethers.parseEther("2500"), // WETH = $2500
      ethers.parseEther("1"), // DAI = $1
    ]
  );
  console.log("✅ Initial prices set");

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network: BASE Sepolia (Chain ID: 84532)");
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("  MockUSDC:", usdcAddress);
  console.log("  MockWETH:", wethAddress);
  console.log("  MockDAI:", daiAddress);
  console.log("  MockPriceOracle:", oracleAddress);
  console.log("\nFaucet Limits:");
  console.log("  USDC: 10,000 USDC/day");
  console.log("  WETH: 10 WETH/day");
  console.log("  DAI: 10,000 DAI/day");
  console.log("\n💡 Use the faucet() function to mint test tokens!");
  console.log("=".repeat(60));

  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    contracts: {
      MockUSDC: usdcAddress,
      MockWETH: wethAddress,
      MockDAI: daiAddress,
      MockPriceOracle: oracleAddress,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployments/baseSepolia.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n📝 Addresses saved to ./deployments/baseSepolia.json");

  // Verification commands
  console.log("\n🔍 To verify contracts on Basescan, run:");
  console.log(`npx hardhat verify --network baseSepolia ${usdcAddress} "Mock USD Coin" "USDC" 6 "1000000000000" "10000000000"`);
  console.log(`npx hardhat verify --network baseSepolia ${wethAddress} "Mock Wrapped Ether" "WETH" 18 "1000000000000000000000" "10000000000000000000"`);
  console.log(`npx hardhat verify --network baseSepolia ${daiAddress} "Mock DAI Stablecoin" "DAI" 18 "1000000000000000000000000" "10000000000000000000000"`);
  console.log(`npx hardhat verify --network baseSepolia ${oracleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
