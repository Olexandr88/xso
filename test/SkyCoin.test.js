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

    it("Should revert with zero addresses", async function () {
      const SkyCoinFactory = await ethers.getContractFactory("SkyCoin");

      await expect(
        SkyCoinFactory.deploy(ethers.ZeroAddress, owner.address)
      ).to.be.revertedWithCustomError(SkyCoinFactory, "ZeroAddress");

      await expect(
        SkyCoinFactory.deploy(recipient.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(SkyCoinFactory, "OwnableInvalidOwner");
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

    it("Should enforce wallet limits", async function () {
      // First, update wallet limit to something testable
      const newWalletLimit = ethers.parseEther("50000000000"); // 50B tokens
      const newTxLimit = ethers.parseEther("10000000000"); // 10B tokens
      await skyCoin.updateLimits(newTxLimit, newWalletLimit);

      // Transfer some tokens to addr1 first (but not exceeding wallet limit)
      await skyCoin.connect(recipient).transfer(addr1.address, ethers.parseEther("1000"));

      // Now try to transfer amount that would make addr2 exceed wallet limit
      // We need to transfer close to the wallet limit to addr2 first
      const almostLimit = newWalletLimit - ethers.parseEther("1000");
      await skyCoin.connect(recipient).transfer(addr2.address, almostLimit);

      // Now this transfer should fail because it would exceed wallet limit
      await expect(
        skyCoin.connect(addr1).transfer(addr2.address, ethers.parseEther("2000"))
      ).to.be.revertedWithCustomError(skyCoin, "ExceedsMaxWallet");
    });

    it("Should allow exempt addresses to bypass limits", async function () {
      // Owner should be exempt by default
      expect(await skyCoin.isExemptFromLimits(owner.address)).to.be.true;
      expect(await skyCoin.isExemptFromLimits(recipient.address)).to.be.true;
    });

    it("Should allow disabling limits", async function () {
      await skyCoin.toggleLimits(false);
      const [, , enabled] = await skyCoin.getLimits();
      expect(enabled).to.be.false;
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

    it("Should prevent transfers to blacklisted addresses", async function () {
      // Blacklist addr2
      await skyCoin.setBlacklisted(addr2.address, true);

      // Should not be able to transfer to blacklisted address
      await expect(
        skyCoin.connect(recipient).transfer(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(skyCoin, "BlacklistedAddress");
    });

    it("Should not allow blacklisting zero address", async function () {
      await expect(
        skyCoin.setBlacklisted(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(skyCoin, "ZeroAddress");
    });

    it("Should emit events when blacklisting", async function () {
      await expect(skyCoin.setBlacklisted(addr1.address, true))
        .to.emit(skyCoin, "AddressBlacklisted")
        .withArgs(addr1.address, true);
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

    it("Should emit pause events", async function () {
      await expect(skyCoin.pause())
        .to.emit(skyCoin, "ContractPaused")
        .withArgs(owner.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
    });
  });

  describe("Admin Functions", function () {
    it("Should update limits correctly", async function () {
      const newMaxTx = ethers.parseEther("50000000000"); // 50B tokens
      const newMaxWallet = ethers.parseEther("100000000000"); // 100B tokens

      await expect(skyCoin.updateLimits(newMaxTx, newMaxWallet))
        .to.emit(skyCoin, "LimitsUpdated")
        .withArgs(newMaxTx, newMaxWallet);

      const [maxTx, maxWallet] = await skyCoin.getLimits();
      expect(maxTx).to.equal(newMaxTx);
      expect(maxWallet).to.equal(newMaxWallet);
    });

    it("Should not allow invalid limit updates", async function () {
      // Test zero amounts
      await expect(
        skyCoin.updateLimits(0, ethers.parseEther("100000000000"))
      ).to.be.revertedWithCustomError(skyCoin, "InvalidAmount");

      await expect(
        skyCoin.updateLimits(ethers.parseEther("50000000000"), 0)
      ).to.be.revertedWithCustomError(skyCoin, "InvalidAmount");

      // Test amounts exceeding total supply
      const exceedsSupply = INITIAL_SUPPLY + BigInt(1);
      await expect(
        skyCoin.updateLimits(exceedsSupply, ethers.parseEther("100000000000"))
      ).to.be.revertedWithCustomError(skyCoin, "InvalidAmount");
    });

    it("Should only allow owner to call admin functions", async function () {
      await expect(
        skyCoin.connect(addr1).pause()
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");

      await expect(
        skyCoin.connect(addr1).setBlacklisted(addr2.address, true)
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");
    });

    it("Should manage exemptions correctly", async function () {
      await expect(skyCoin.setExemptFromLimits(addr1.address, true))
        .to.emit(skyCoin, "ExemptionUpdated")
        .withArgs(addr1.address, true);

      expect(await skyCoin.isExemptFromLimits(addr1.address)).to.be.true;

      // Should not allow zero address
      await expect(
        skyCoin.setExemptFromLimits(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(skyCoin, "ZeroAddress");
    });
  });

  describe("Emergency Functions", function () {
    it("Should execute emergency remove limits", async function () {
      // Execute emergency function
      await expect(skyCoin.emergencyRemoveLimits())
        .to.emit(skyCoin, "LimitsToggled")
        .withArgs(false)
        .and.to.emit(skyCoin, "LimitsUpdated")
        .withArgs(INITIAL_SUPPLY, INITIAL_SUPPLY);

      // Check that limits are disabled and set to max
      const [maxTx, maxWallet, enabled] = await skyCoin.getLimits();
      expect(enabled).to.be.false;
      expect(maxTx).to.equal(INITIAL_SUPPLY);
      expect(maxWallet).to.equal(INITIAL_SUPPLY);
    });

    it("Should only allow owner to call emergency functions", async function () {
      await expect(
        skyCoin.connect(addr1).emergencyRemoveLimits()
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burn Functionality", function () {
    it("Should allow token burning", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await skyCoin.totalSupply();
      const initialBalance = await skyCoin.balanceOf(recipient.address);

      await skyCoin.connect(recipient).burn(burnAmount);

      expect(await skyCoin.totalSupply()).to.equal(initialSupply - burnAmount);
      expect(await skyCoin.balanceOf(recipient.address)).to.equal(initialBalance - burnAmount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct blacklist status", async function () {
      expect(await skyCoin.isBlacklisted(addr1.address)).to.be.false;

      await skyCoin.setBlacklisted(addr1.address, true);
      expect(await skyCoin.isBlacklisted(addr1.address)).to.be.true;
    });

    it("Should return correct exemption status", async function () {
      expect(await skyCoin.isExemptFromLimits(addr1.address)).to.be.false;
      expect(await skyCoin.isExemptFromLimits(owner.address)).to.be.true;
    });
  });
});
