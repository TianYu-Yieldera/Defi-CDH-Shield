import { expect } from "chai";
import { ethers } from "hardhat";
import {
    CDPShield,
    FlashLoanReceiver,
    MockAavePool,
    MockERC20,
    MockPriceOracle,
    MockDEXAggregator
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FlashLoan Integration", function () {
    let cdpShield: CDPShield;
    let flashLoanReceiver: FlashLoanReceiver;
    let aavePool: MockAavePool;
    let collateralToken: MockERC20;
    let debtToken: MockERC20;
    let priceOracle: MockPriceOracle;
    let dexAggregator: MockDEXAggregator;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;

    const INITIAL_SUPPLY = ethers.parseEther("1000000");
    const DAILY_MINT_LIMIT = ethers.parseEther("10000");
    const COLLATERAL_PRICE = ethers.parseEther("2000"); // $2000 per collateral
    const DEBT_PRICE = ethers.parseEther("1"); // $1 per debt token
    const EXCHANGE_RATE = ethers.parseEther("2000"); // 1 collateral = 2000 debt

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy Mock tokens
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        collateralToken = await MockERC20Factory.deploy(
            "Wrapped ETH",
            "WETH",
            18,
            INITIAL_SUPPLY,
            DAILY_MINT_LIMIT
        );

        debtToken = await MockERC20Factory.deploy(
            "USD Coin",
            "USDC",
            18,
            INITIAL_SUPPLY,
            DAILY_MINT_LIMIT
        );

        // Deploy Price Oracle and set prices
        const MockPriceOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        priceOracle = await MockPriceOracleFactory.deploy();
        await priceOracle.setPrice(await collateralToken.getAddress(), COLLATERAL_PRICE);
        await priceOracle.setPrice(await debtToken.getAddress(), DEBT_PRICE);

        // Deploy DEX Aggregator
        const MockDEXAggregatorFactory = await ethers.getContractFactory("MockDEXAggregator");
        dexAggregator = await MockDEXAggregatorFactory.deploy();

        const collateralAddress = await collateralToken.getAddress();
        const debtAddress = await debtToken.getAddress();

        await dexAggregator.addAllowedToken(collateralAddress);
        await dexAggregator.addAllowedToken(debtAddress);
        await dexAggregator.setExchangeRate(collateralAddress, debtAddress, EXCHANGE_RATE);

        // Fund DEX with debt tokens for swaps
        await debtToken.transfer(await dexAggregator.getAddress(), ethers.parseEther("500000"));

        // Deploy Aave Pool Mock
        const MockAavePoolFactory = await ethers.getContractFactory("MockAavePool");
        aavePool = await MockAavePoolFactory.deploy();

        // Fund Aave Pool with debt tokens for flash loans
        await debtToken.transfer(await aavePool.getAddress(), ethers.parseEther("100000"));

        // Deploy CDPShield
        const CDPShieldFactory = await ethers.getContractFactory("CDPShield");
        cdpShield = await CDPShieldFactory.deploy(
            await priceOracle.getAddress(),
            await dexAggregator.getAddress()
        );

        // Deploy FlashLoanReceiver
        const FlashLoanReceiverFactory = await ethers.getContractFactory("FlashLoanReceiver");
        flashLoanReceiver = await FlashLoanReceiverFactory.deploy(
            await aavePool.getAddress(),
            await cdpShield.getAddress(),
            await dexAggregator.getAddress()
        );

        // Configure CDPShield with flash loan components
        await cdpShield.setAavePool(await aavePool.getAddress());
        await cdpShield.setFlashLoanReceiver(await flashLoanReceiver.getAddress());

        // Give user1 some tokens
        await collateralToken.transfer(user1.address, ethers.parseEther("100"));
        await debtToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    describe("FlashLoanReceiver Deployment", function () {
        it("Should set correct Aave Pool", async function () {
            expect(await flashLoanReceiver.AAVE_POOL()).to.equal(await aavePool.getAddress());
        });

        it("Should set correct CDPShield", async function () {
            expect(await flashLoanReceiver.cdpShield()).to.equal(await cdpShield.getAddress());
        });

        it("Should set correct DEX Aggregator", async function () {
            expect(await flashLoanReceiver.dexAggregator()).to.equal(await dexAggregator.getAddress());
        });
    });

    describe("CDPShield Flash Loan Configuration", function () {
        it("Should set Aave Pool address", async function () {
            expect(await cdpShield.aavePool()).to.equal(await aavePool.getAddress());
        });

        it("Should set Flash Loan Receiver address", async function () {
            expect(await cdpShield.flashLoanReceiver()).to.equal(await flashLoanReceiver.getAddress());
        });

        it("Should revert setAavePool with zero address", async function () {
            await expect(
                cdpShield.setAavePool(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should revert setFlashLoanReceiver with zero address", async function () {
            await expect(
                cdpShield.setFlashLoanReceiver(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should only allow owner to set Aave Pool", async function () {
            await expect(
                cdpShield.connect(user1).setAavePool(await aavePool.getAddress())
            ).to.be.revertedWithCustomError(cdpShield, "OwnableUnauthorizedAccount");
        });
    });

    describe("Flash Loan Reduce Leverage", function () {
        let positionId: number;

        beforeEach(async function () {
            // Register a position for user1
            // 10 ETH collateral ($20,000) with 10,000 USDC debt
            // Health Factor = 20000/10000 = 2.0
            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"),
                ethers.parseEther("10000")
            );
            positionId = 1;

            // Approve CDPShield to spend user's collateral
            await collateralToken.connect(user1).approve(
                await cdpShield.getAddress(),
                ethers.MaxUint256
            );
        });

        it("Should revert if Aave Pool not set", async function () {
            // Deploy new CDPShield without flash loan config
            const CDPShieldFactory = await ethers.getContractFactory("CDPShield");
            const newCdpShield = await CDPShieldFactory.deploy(
                await priceOracle.getAddress(),
                await dexAggregator.getAddress()
            );

            await newCdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"),
                ethers.parseEther("10000")
            );

            await expect(
                newCdpShield.connect(user1).flashLoanReduceLeverage(
                    1,
                    ethers.parseEther("2000"),
                    ethers.parseEther("2000")
                )
            ).to.be.revertedWith("Aave Pool not set");
        });

        it("Should revert if Flash Loan Receiver not set", async function () {
            // Deploy new CDPShield with only Aave Pool
            const CDPShieldFactory = await ethers.getContractFactory("CDPShield");
            const newCdpShield = await CDPShieldFactory.deploy(
                await priceOracle.getAddress(),
                await dexAggregator.getAddress()
            );

            await newCdpShield.setAavePool(await aavePool.getAddress());

            await newCdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"),
                ethers.parseEther("10000")
            );

            await expect(
                newCdpShield.connect(user1).flashLoanReduceLeverage(
                    1,
                    ethers.parseEther("2000"),
                    ethers.parseEther("2000")
                )
            ).to.be.revertedWith("Flash loan receiver not set");
        });

        it("Should revert if debt amount is zero", async function () {
            await expect(
                cdpShield.connect(user1).flashLoanReduceLeverage(
                    positionId,
                    0,
                    ethers.parseEther("0")
                )
            ).to.be.revertedWith("Invalid debt amount");
        });

        it("Should revert if debt to repay exceeds position debt", async function () {
            await expect(
                cdpShield.connect(user1).flashLoanReduceLeverage(
                    positionId,
                    ethers.parseEther("20000"), // More than 10000 debt
                    ethers.parseEther("20000")
                )
            ).to.be.revertedWith("Exceeds debt amount");
        });
    });

    describe("Flash Loan Emergency Close", function () {
        let positionId: number;

        beforeEach(async function () {
            // Register a position with low health factor
            // 1.1 ETH collateral ($2,200) with 2,000 USDC debt
            // Health Factor = 2200/2000 = 1.1 (at liquidation threshold)
            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("1.1"),
                ethers.parseEther("2000")
            );
            positionId = 1;

            // Approve CDPShield to spend user's collateral
            await collateralToken.connect(user1).approve(
                await cdpShield.getAddress(),
                ethers.MaxUint256
            );
        });

        it("Should revert if Aave Pool not set", async function () {
            const CDPShieldFactory = await ethers.getContractFactory("CDPShield");
            const newCdpShield = await CDPShieldFactory.deploy(
                await priceOracle.getAddress(),
                await dexAggregator.getAddress()
            );

            await newCdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("1.1"),
                ethers.parseEther("2000")
            );

            await expect(
                newCdpShield.connect(user1).flashLoanEmergencyClose(
                    1,
                    ethers.parseEther("2000")
                )
            ).to.be.revertedWith("Aave Pool not set");
        });

        it("Should revert if health factor not critical", async function () {
            // Create a healthy position (HF > 1.1)
            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"), // 10 ETH = $20,000
                ethers.parseEther("10000") // $10,000 debt, HF = 2.0
            );

            await expect(
                cdpShield.connect(user1).flashLoanEmergencyClose(
                    2, // Second position
                    ethers.parseEther("10000")
                )
            ).to.be.revertedWith("Health factor not critical");
        });
    });

    describe("MockAavePool", function () {
        it("Should have flash loan liquidity", async function () {
            const balance = await aavePool.getBalance(await debtToken.getAddress());
            expect(balance).to.equal(ethers.parseEther("100000"));
        });

        it("Should accept deposits", async function () {
            await debtToken.approve(await aavePool.getAddress(), ethers.parseEther("1000"));
            await aavePool.deposit(await debtToken.getAddress(), ethers.parseEther("1000"));

            const balance = await aavePool.getBalance(await debtToken.getAddress());
            expect(balance).to.equal(ethers.parseEther("101000"));
        });

        it("Should calculate correct flash loan premium", async function () {
            // Premium is 0.05% (5 bps)
            const amount = ethers.parseEther("10000");
            const expectedPremium = amount * 5n / 10000n; // 5 USDC
            expect(expectedPremium).to.equal(ethers.parseEther("5"));
        });
    });

    describe("FlashLoanReceiver Admin Functions", function () {
        it("Should allow owner to update CDPShield", async function () {
            const newAddress = user1.address;
            await flashLoanReceiver.setCDPShield(newAddress);
            expect(await flashLoanReceiver.cdpShield()).to.equal(newAddress);
        });

        it("Should allow owner to update DEX Aggregator", async function () {
            const newAddress = user1.address;
            await flashLoanReceiver.setDEXAggregator(newAddress);
            expect(await flashLoanReceiver.dexAggregator()).to.equal(newAddress);
        });

        it("Should revert setCDPShield with zero address", async function () {
            await expect(
                flashLoanReceiver.setCDPShield(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(flashLoanReceiver, "InvalidCDPShield");
        });

        it("Should revert setDEXAggregator with zero address", async function () {
            await expect(
                flashLoanReceiver.setDEXAggregator(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(flashLoanReceiver, "InvalidDEXAggregator");
        });

        it("Should only allow owner to update CDPShield", async function () {
            await expect(
                flashLoanReceiver.connect(user1).setCDPShield(user1.address)
            ).to.be.revertedWithCustomError(flashLoanReceiver, "OwnableUnauthorizedAccount");
        });

        it("Should allow emergency withdraw", async function () {
            // Send some tokens to the receiver
            await debtToken.transfer(await flashLoanReceiver.getAddress(), ethers.parseEther("100"));

            const balanceBefore = await debtToken.balanceOf(owner.address);
            await flashLoanReceiver.emergencyWithdraw(
                await debtToken.getAddress(),
                ethers.parseEther("100")
            );
            const balanceAfter = await debtToken.balanceOf(owner.address);

            expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("100"));
        });
    });
});
