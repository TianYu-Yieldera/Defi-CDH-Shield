import { expect } from "chai";
import { ethers } from "hardhat";
import { MockPriceOracle, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockPriceOracle", function () {
  let oracle: MockPriceOracle;
  let mockToken1: MockERC20;
  let mockToken2: MockERC20;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy oracle
    const MockPriceOracleFactory = await ethers.getContractFactory("MockPriceOracle");
    oracle = await MockPriceOracleFactory.deploy();
    await oracle.waitForDeployment();

    // Deploy mock tokens for testing
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken1 = await MockERC20Factory.deploy(
      "Token 1",
      "TK1",
      18,
      0,
      0
    );
    mockToken2 = await MockERC20Factory.deploy(
      "Token 2",
      "TK2",
      18,
      0,
      0
    );
    await mockToken1.waitForDeployment();
    await mockToken2.waitForDeployment();
  });

  describe("Price Setting", function () {
    it("Should allow owner to set price", async function () {
      const price = ethers.parseEther("2500");
      const tokenAddress = await mockToken1.getAddress();

      await oracle.setPrice(tokenAddress, price);

      expect(await oracle.getPrice(tokenAddress)).to.equal(price);
    });

    it("Should not allow non-owner to set price", async function () {
      const price = ethers.parseEther("2500");
      const tokenAddress = await mockToken1.getAddress();

      await expect(
        oracle.connect(user).setPrice(tokenAddress, price)
      ).to.be.reverted;
    });

    it("Should revert for zero address", async function () {
      const price = ethers.parseEther("2500");

      await expect(
        oracle.setPrice(ethers.ZeroAddress, price)
      ).to.be.revertedWith("Invalid token");
    });

    it("Should revert for zero price", async function () {
      const tokenAddress = await mockToken1.getAddress();

      await expect(
        oracle.setPrice(tokenAddress, 0)
      ).to.be.revertedWith("Invalid price");
    });

    it("Should emit PriceUpdated event", async function () {
      const price = ethers.parseEther("2500");
      const tokenAddress = await mockToken1.getAddress();

      await expect(oracle.setPrice(tokenAddress, price))
        .to.emit(oracle, "PriceUpdated")
        .withArgs(tokenAddress, price, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });
  });

  describe("Batch Price Setting", function () {
    it("Should allow setting multiple prices", async function () {
      const token1Address = await mockToken1.getAddress();
      const token2Address = await mockToken2.getAddress();
      const prices = [ethers.parseEther("2500"), ethers.parseEther("1")];

      await oracle.setPrices([token1Address, token2Address], prices);

      expect(await oracle.getPrice(token1Address)).to.equal(prices[0]);
      expect(await oracle.getPrice(token2Address)).to.equal(prices[1]);
    });

    it("Should revert on length mismatch", async function () {
      const token1Address = await mockToken1.getAddress();
      const prices = [ethers.parseEther("2500"), ethers.parseEther("1")];

      await expect(
        oracle.setPrices([token1Address], prices)
      ).to.be.revertedWith("Length mismatch");
    });
  });

  describe("Price Queries", function () {
    beforeEach(async function () {
      const token1Address = await mockToken1.getAddress();
      const token2Address = await mockToken2.getAddress();

      await oracle.setPrices(
        [token1Address, token2Address],
        [ethers.parseEther("2500"), ethers.parseEther("1")]
      );
    });

    it("Should return correct price for token", async function () {
      const token1Address = await mockToken1.getAddress();
      expect(await oracle.getPrice(token1Address)).to.equal(
        ethers.parseEther("2500")
      );
    });

    it("Should return multiple prices", async function () {
      const token1Address = await mockToken1.getAddress();
      const token2Address = await mockToken2.getAddress();

      const prices = await oracle.getPrices([token1Address, token2Address]);

      expect(prices[0]).to.equal(ethers.parseEther("2500"));
      expect(prices[1]).to.equal(ethers.parseEther("1"));
    });

    it("Should revert for unset price", async function () {
      const randomAddress = ethers.Wallet.createRandom().address;

      await expect(oracle.getPrice(randomAddress)).to.be.revertedWith(
        "Price not set"
      );
    });
  });

  describe("Price Staleness", function () {
    it("Should report fresh price as not stale", async function () {
      const tokenAddress = await mockToken1.getAddress();
      await oracle.setPrice(tokenAddress, ethers.parseEther("2500"));

      expect(await oracle.isPriceStale(tokenAddress)).to.be.false;
    });

    it("Should report old price as stale", async function () {
      const tokenAddress = await mockToken1.getAddress();
      await oracle.setPrice(tokenAddress, ethers.parseEther("2500"));

      // Fast forward 2 hours
      await ethers.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      expect(await oracle.isPriceStale(tokenAddress)).to.be.true;
    });

    it("Should report unset price as stale", async function () {
      const tokenAddress = await mockToken1.getAddress();

      expect(await oracle.isPriceStale(tokenAddress)).to.be.true;
    });
  });

  describe("Last Update Timestamp", function () {
    it("Should track last update time", async function () {
      const tokenAddress = await mockToken1.getAddress();
      await oracle.setPrice(tokenAddress, ethers.parseEther("2500"));

      const lastUpdate = await oracle.getLastUpdate(tokenAddress);
      expect(lastUpdate).to.be.gt(0);
    });

    it("Should return 0 for unset token", async function () {
      const tokenAddress = await mockToken1.getAddress();

      expect(await oracle.getLastUpdate(tokenAddress)).to.equal(0);
    });
  });
});
