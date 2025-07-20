const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkyCoin", function () {
  let SkyCoin, skyCoin, owner, recipient, addr1, addr2;
  const INITIAL_SUPPLY = ethers.parseEther("1000000000000"); // 1 trillion tokens

  beforeEach(async function () {
    [owner, recipient, addr1, addr2] = await ethers.getSigners();
    SkyCoin = await ethers.getContractFactory("SkyCoin");
    skyCoin = await SkyCoin.deploy(recipient.address, owner.address);
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await skyCoin.name()).to.equal("Sky Coin");
      expect(await skyCoin.symbol()).to.equal("XSO");
    });

    it("Should mint initial supply to recipient", async function () {
      expect(await skyCoin.balanceOf(recipient.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set correct initial limits", async function () {
      const [maxTx, maxWallet, enabled] = await skyCoin.getLimits();
      expect(maxTx).to.equal(INITIAL_SUPPLY * BigInt(10) / BigInt(100)); // 10%
      expect(maxWallet).to.equal(INITIAL_SUPPLY); // 100%
      expect(enabled).to.be.true;
    });
  });

  describe("Anti-Whale Protection", function () {
    it("Should enforce transaction limits", async function () {
      const maxTx = INITIAL_SUPPLY * BigInt(10) / BigInt(100);

      // Transfer to a non-exempt address first
      await skyCoin.connect(recipient).transfer(addr1.address, ethers.parseEther("1000"));

      // Now try to exceed limit from non-exempt address
      await expect(
        skyCoin.connect(addr1).transfer(addr2.address, maxTx + BigInt(1))
      ).to.be.revertedWithCustomError(skyCoin, "ExceedsMaxTransaction");
    });

    it("Should allow exempt addresses to bypass limits", async function () {
      // Owner should be exempt by default
      expect(await skyCoin.isExemptFromLimits(owner.address)).to.be.true;
    });
  });

  describe("Blacklist Functionality", function () {
    it("Should prevent blacklisted addresses from transferring", async function () {
      // Transfer some tokens to addr1 first
      await skyCoin.connect(recipient).transfer(addr1.address, ethers.parseEther("1000"));

      // Blacklist addr1
      await skyCoin.setBlacklisted(addr1.address, true);

      // Now addr1 should not be able to transfer
      await expect(
        skyCoin.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(skyCoin, "BlacklistedAddress");
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause transfers", async function () {
      await skyCoin.pause();

      await expect(
        skyCoin.connect(recipient).transfer(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(skyCoin, "EnforcedPause");

      await skyCoin.unpause();
      await expect(
        skyCoin.connect(recipient).transfer(addr1.address, ethers.parseEther("100"))
      ).to.not.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should update limits correctly", async function () {
      const newMaxTx = ethers.parseEther("50000000000"); // 50B tokens
      const newMaxWallet = ethers.parseEther("100000000000"); // 100B tokens

      await skyCoin.updateLimits(newMaxTx, newMaxWallet);

      const [maxTx, maxWallet] = await skyCoin.getLimits();
      expect(maxTx).to.equal(newMaxTx);
      expect(maxWallet).to.equal(newMaxWallet);
    });

    it("Should only allow owner to call admin functions", async function () {
      await expect(
        skyCoin.connect(addr1).pause()
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");
    });
  });
});
