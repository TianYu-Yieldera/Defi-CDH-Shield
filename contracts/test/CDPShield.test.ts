import { expect } from "chai";
import { ethers } from "hardhat";
import { CDPShield, MockERC20, MockPriceOracle, MockDEXAggregator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CDPShield", function () {
    let cdpShield: CDPShield;
    let collateralToken: MockERC20;
    let debtToken: MockERC20;
    let priceOracle: MockPriceOracle;
    let dexAggregator: MockDEXAggregator;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    const INITIAL_SUPPLY = ethers.parseEther("1000000");
    const DAILY_MINT_LIMIT = ethers.parseEther("10000");
    const COLLATERAL_PRICE = ethers.parseEther("2000");
    const DEBT_PRICE = ethers.parseEther("1");
    const EXCHANGE_RATE = ethers.parseEther("2000");

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

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

        const MockPriceOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        priceOracle = await MockPriceOracleFactory.deploy();

        await priceOracle.setPrice(await collateralToken.getAddress(), COLLATERAL_PRICE);
        await priceOracle.setPrice(await debtToken.getAddress(), DEBT_PRICE);

        const MockDEXAggregatorFactory = await ethers.getContractFactory("MockDEXAggregator");
        dexAggregator = await MockDEXAggregatorFactory.deploy();

        const collateralAddress = await collateralToken.getAddress();
        const debtAddress = await debtToken.getAddress();

        await dexAggregator.addAllowedToken(collateralAddress);
        await dexAggregator.addAllowedToken(debtAddress);
        await dexAggregator.setExchangeRate(collateralAddress, debtAddress, EXCHANGE_RATE);

        await debtToken.transfer(await dexAggregator.getAddress(), ethers.parseEther("500000"));

        const CDPShieldFactory = await ethers.getContractFactory("CDPShield");
        cdpShield = await CDPShieldFactory.deploy(
            await priceOracle.getAddress(),
            await dexAggregator.getAddress()
        );

        await collateralToken.transfer(user1.address, ethers.parseEther("100"));
        await debtToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await cdpShield.owner()).to.equal(owner.address);
        });

        it("Should set the correct price oracle", async function () {
            expect(await cdpShield.priceOracle()).to.equal(await priceOracle.getAddress());
        });

        it("Should set the correct DEX aggregator", async function () {
            expect(await cdpShield.dexAggregator()).to.equal(await dexAggregator.getAddress());
        });

        it("Should not be paused initially", async function () {
            expect(await cdpShield.isPaused()).to.equal(false);
        });
    });

    describe("Position Registration", function () {
        it("Should register a new position successfully", async function () {
            const collateralAmount = ethers.parseEther("10");
            const debtAmount = ethers.parseEther("10000");

            const tx = await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                collateralAmount,
                debtAmount
            );

            await expect(tx).to.emit(cdpShield, "PositionRegistered");

            const positionId = 1;
            const position = await cdpShield.getPosition(positionId);

            expect(position.owner).to.equal(user1.address);
            expect(position.collateralAmount).to.equal(collateralAmount);
            expect(position.debtAmount).to.equal(debtAmount);
            expect(position.status).to.equal(0);
        });

        it("Should calculate correct health factor on registration", async function () {
            const collateralAmount = ethers.parseEther("10");
            const debtAmount = ethers.parseEther("10000");

            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                collateralAmount,
                debtAmount
            );

            const position = await cdpShield.getPosition(1);
            const expectedHealthFactor = ethers.parseEther("2");

            expect(position.healthFactor).to.equal(expectedHealthFactor);
        });

        it("Should revert if collateral amount is zero", async function () {
            await expect(
                cdpShield.connect(user1).registerPosition(
                    user1.address,
                    await collateralToken.getAddress(),
                    await debtToken.getAddress(),
                    0,
                    ethers.parseEther("10000")
                )
            ).to.be.revertedWith("Invalid collateral amount");
        });

        it("Should revert if debt amount is zero", async function () {
            await expect(
                cdpShield.connect(user1).registerPosition(
                    user1.address,
                    await collateralToken.getAddress(),
                    await debtToken.getAddress(),
                    ethers.parseEther("10"),
                    0
                )
            ).to.be.revertedWith("Invalid debt amount");
        });

        it("Should revert if health factor is too low", async function () {
            await expect(
                cdpShield.connect(user1).registerPosition(
                    user1.address,
                    await collateralToken.getAddress(),
                    await debtToken.getAddress(),
                    ethers.parseEther("1"),
                    ethers.parseEther("10000")
                )
            ).to.be.revertedWith("Health factor too low");
        });
    });

    describe("Health Factor Calculation", function () {
        it("Should calculate health factor correctly", async function () {
            const collateralAmount = ethers.parseEther("10");
            const debtAmount = ethers.parseEther("10000");

            const healthFactor = await cdpShield.calculateHealthFactor(
                collateralAmount,
                debtAmount,
                await collateralToken.getAddress(),
                await debtToken.getAddress()
            );

            const expectedHealthFactor = ethers.parseEther("2");
            expect(healthFactor).to.equal(expectedHealthFactor);
        });

        it("Should return max uint256 when debt is zero", async function () {
            const healthFactor = await cdpShield.calculateHealthFactor(
                ethers.parseEther("10"),
                0,
                await collateralToken.getAddress(),
                await debtToken.getAddress()
            );

            expect(healthFactor).to.equal(ethers.MaxUint256);
        });
    });

    describe("Update Position", function () {
        let positionId: number;

        beforeEach(async function () {
            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"),
                ethers.parseEther("10000")
            );
            positionId = 1;
        });

        it("Should update position successfully", async function () {
            const newCollateral = ethers.parseEther("15");
            const newDebt = ethers.parseEther("15000");

            await cdpShield.connect(user1).updatePosition(
                positionId,
                newCollateral,
                newDebt
            );

            const position = await cdpShield.getPosition(positionId);
            expect(position.collateralAmount).to.equal(newCollateral);
            expect(position.debtAmount).to.equal(newDebt);
        });

        it("Should emit PositionUpdated event", async function () {
            const tx = await cdpShield.connect(user1).updatePosition(
                positionId,
                ethers.parseEther("15"),
                ethers.parseEther("15000")
            );

            await expect(tx).to.emit(cdpShield, "PositionUpdated");
        });

        it("Should revert if not position owner", async function () {
            await expect(
                cdpShield.connect(user2).updatePosition(
                    positionId,
                    ethers.parseEther("15"),
                    ethers.parseEther("15000")
                )
            ).to.be.revertedWith("Not position owner");
        });
    });

    describe("Reduce Leverage", function () {
        let positionId: number;

        beforeEach(async function () {
            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"),
                ethers.parseEther("10000")
            );
            positionId = 1;

            await collateralToken.connect(user1).approve(
                await cdpShield.getAddress(),
                ethers.MaxUint256
            );
        });

        it("Should reduce leverage successfully", async function () {
            const debtToRepay = ethers.parseEther("2000");

            const swapParams = {
                dexAggregator: await dexAggregator.getAddress(),
                tokenIn: await collateralToken.getAddress(),
                tokenOut: await debtToken.getAddress(),
                amountIn: ethers.parseEther("1.01"),
                minAmountOut: debtToRepay
            };

            const tx = await cdpShield.connect(user1).reduceLeverage(
                positionId,
                debtToRepay,
                swapParams
            );

            await expect(tx).to.emit(cdpShield, "LeverageReduced");

            const position = await cdpShield.getPosition(positionId);
            expect(position.debtAmount).to.be.lt(ethers.parseEther("10000"));
        });

        it("Should increase health factor after reducing leverage", async function () {
            const positionBefore = await cdpShield.getPosition(positionId);
            const healthFactorBefore = positionBefore.healthFactor;

            const debtToRepay = ethers.parseEther("2000");

            const swapParams = {
                dexAggregator: await dexAggregator.getAddress(),
                tokenIn: await collateralToken.getAddress(),
                tokenOut: await debtToken.getAddress(),
                amountIn: ethers.parseEther("1.01"),
                minAmountOut: debtToRepay
            };

            await cdpShield.connect(user1).reduceLeverage(
                positionId,
                debtToRepay,
                swapParams
            );

            const positionAfter = await cdpShield.getPosition(positionId);
            expect(positionAfter.healthFactor).to.be.gt(healthFactorBefore);
        });

        it("Should revert if debt amount exceeds position debt", async function () {
            const debtToRepay = ethers.parseEther("20000");

            const swapParams = {
                dexAggregator: await dexAggregator.getAddress(),
                tokenIn: await collateralToken.getAddress(),
                tokenOut: await debtToken.getAddress(),
                amountIn: ethers.parseEther("10.1"),
                minAmountOut: debtToRepay
            };

            await expect(
                cdpShield.connect(user1).reduceLeverage(
                    positionId,
                    debtToRepay,
                    swapParams
                )
            ).to.be.revertedWith("Exceeds debt amount");
        });
    });

    describe("Pause and Unpause", function () {
        it("Should pause the contract", async function () {
            await cdpShield.pause();
            expect(await cdpShield.isPaused()).to.equal(true);
        });

        it("Should unpause the contract", async function () {
            await cdpShield.pause();
            await cdpShield.unpause();
            expect(await cdpShield.isPaused()).to.equal(false);
        });

        it("Should revert register position when paused", async function () {
            await cdpShield.pause();

            await expect(
                cdpShield.connect(user1).registerPosition(
                    user1.address,
                    await collateralToken.getAddress(),
                    await debtToken.getAddress(),
                    ethers.parseEther("10"),
                    ethers.parseEther("10000")
                )
            ).to.be.revertedWithCustomError(cdpShield, "EnforcedPause");
        });

        it("Should only allow owner to pause", async function () {
            await expect(
                cdpShield.connect(user1).pause()
            ).to.be.revertedWithCustomError(cdpShield, "OwnableUnauthorizedAccount");
        });
    });

    describe("View Functions", function () {
        it("Should return position count", async function () {
            expect(await cdpShield.getPositionCount()).to.equal(0);

            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"),
                ethers.parseEther("10000")
            );

            expect(await cdpShield.getPositionCount()).to.equal(1);
        });

        it("Should return user positions", async function () {
            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("10"),
                ethers.parseEther("10000")
            );

            await cdpShield.connect(user1).registerPosition(
                user1.address,
                await collateralToken.getAddress(),
                await debtToken.getAddress(),
                ethers.parseEther("20"),
                ethers.parseEther("20000")
            );

            const positions = await cdpShield.getUserPositions(user1.address);
            expect(positions.length).to.equal(2);
            expect(positions[0]).to.equal(1);
            expect(positions[1]).to.equal(2);
        });
    });
});
