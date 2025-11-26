import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockERC20", function () {
  let mockToken: MockERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const TOKEN_NAME = "Mock Token";
  const TOKEN_SYMBOL = "MOCK";
  const DECIMALS = 18;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const DAILY_LIMIT = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      DECIMALS,
      INITIAL_SUPPLY,
      DAILY_LIMIT
    );
    await mockToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await mockToken.name()).to.equal(TOKEN_NAME);
      expect(await mockToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set the correct decimals", async function () {
      expect(await mockToken.decimals()).to.equal(DECIMALS);
    });

    it("Should mint initial supply to owner", async function () {
      expect(await mockToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct daily mint limit", async function () {
      expect(await mockToken.dailyMintLimit()).to.equal(DAILY_LIMIT);
    });
  });

  describe("Minting (Owner)", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await mockToken.mint(user1.address, mintAmount);

      expect(await mockToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        mockToken.connect(user1).mint(user2.address, mintAmount)
      ).to.be.reverted;
    });
  });

  describe("Faucet", function () {
    it("Should allow users to claim from faucet", async function () {
      await mockToken.connect(user1).faucet();

      expect(await mockToken.balanceOf(user1.address)).to.equal(DAILY_LIMIT);
    });

    it("Should track daily minted amount", async function () {
      await mockToken.connect(user1).faucet();

      expect(await mockToken.dailyMinted(user1.address)).to.equal(DAILY_LIMIT);
    });

    it("Should not allow claiming more than daily limit", async function () {
      await mockToken.connect(user1).faucet();

      await expect(mockToken.connect(user1).faucet()).to.be.revertedWith(
        "Daily mint limit reached"
      );
    });

    it("Should reset after 24 hours", async function () {
      await mockToken.connect(user1).faucet();

      // Fast forward 24 hours
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await mockToken.connect(user1).faucet();

      expect(await mockToken.balanceOf(user1.address)).to.equal(
        DAILY_LIMIT * 2n
      );
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("1000");

      await mockToken.transfer(user1.address, burnAmount);
      await mockToken.connect(user1).burn(burnAmount);

      expect(await mockToken.balanceOf(user1.address)).to.equal(0);
    });
  });

  describe("Daily Limit Updates", function () {
    it("Should allow owner to update daily limit", async function () {
      const newLimit = ethers.parseEther("5000");
      await mockToken.setDailyMintLimit(newLimit);

      expect(await mockToken.dailyMintLimit()).to.equal(newLimit);
    });

    it("Should not allow non-owner to update daily limit", async function () {
      const newLimit = ethers.parseEther("5000");
      await expect(
        mockToken.connect(user1).setDailyMintLimit(newLimit)
      ).to.be.reverted;
    });
  });
});
