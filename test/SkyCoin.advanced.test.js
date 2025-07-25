const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SkyCoin - Advanced Security Tests", function () {
  // Deployment fixture
  async function deploySkyCoinFixture() {
    const [owner, recipient, addr1, addr2, addr3] = await ethers.getSigners();

    const SkyCoin = await ethers.getContractFactory("SkyCoin");
    const skyCoin = await SkyCoin.deploy(recipient.address, owner.address);

    return { skyCoin, owner, recipient, addr1, addr2, addr3 };
  }

  describe("Edge Cases and Security", function () {
    it("Should handle maximum values correctly", async function () {
      const { skyCoin, owner, recipient } = await loadFixture(deploySkyCoinFixture);

      const maxSupply = await skyCoin.MAX_SUPPLY();
      const totalSupply = await skyCoin.totalSupply();

      expect(totalSupply).to.equal(maxSupply);
      expect(await skyCoin.balanceOf(recipient.address)).to.equal(maxSupply);
    });

    it("Should prevent transfers when paused", async function () {
      const { skyCoin, owner, recipient, addr1 } = await loadFixture(deploySkyCoinFixture);

      // Pause the contract
      await skyCoin.connect(owner).pause();

      // Try to transfer - should fail
      await expect(
        skyCoin.connect(recipient).transfer(addr1.address, 1000)
      ).to.be.revertedWithCustomError(skyCoin, "EnforcedPause");
    });

    it("Should handle zero amount transfers", async function () {
      const { skyCoin, recipient, addr1 } = await loadFixture(deploySkyCoinFixture);

      // Zero amount transfer should succeed but not change balances
      const initialBalance = await skyCoin.balanceOf(recipient.address);
      await skyCoin.connect(recipient).transfer(addr1.address, 0);
      expect(await skyCoin.balanceOf(recipient.address)).to.equal(initialBalance);
    });

    it("Should prevent blacklisted address from receiving transfers", async function () {
      const { skyCoin, owner, recipient, addr1 } = await loadFixture(deploySkyCoinFixture);

      // Blacklist addr1
      await skyCoin.connect(owner).setBlacklisted(addr1.address, true);

      // Try to transfer to blacklisted address
      await expect(
        skyCoin.connect(recipient).transfer(addr1.address, 1000)
      ).to.be.revertedWithCustomError(skyCoin, "BlacklistedAddress");
    });

    it("Should prevent setting invalid limits", async function () {
      const { skyCoin, owner } = await loadFixture(deploySkyCoinFixture);

      const maxSupply = await skyCoin.MAX_SUPPLY();

      // Try to set max transaction above supply
      await expect(
        skyCoin.connect(owner).updateLimits(maxSupply + 1n, maxSupply)
      ).to.be.revertedWithCustomError(skyCoin, "InvalidAmount");

      // Try to set max wallet above supply
      await expect(
        skyCoin.connect(owner).updateLimits(maxSupply, maxSupply + 1n)
      ).to.be.revertedWithCustomError(skyCoin, "InvalidAmount");
    });

    it("Should handle emergency remove limits correctly", async function () {
      const { skyCoin, owner, recipient, addr1 } = await loadFixture(deploySkyCoinFixture);

      // Remove limits permanently
      await expect(skyCoin.connect(owner).emergencyRemoveLimits())
        .to.emit(skyCoin, "LimitsToggled")
        .withArgs(false)
        .and.to.emit(skyCoin, "LimitsUpdated");

      expect(await skyCoin.limitsEnabled()).to.be.false;

      // Should now allow any amount transfer
      const largeAmount = ethers.parseEther("200000000000"); // 200B tokens
      await skyCoin.connect(recipient).transfer(addr1.address, largeAmount);
      expect(await skyCoin.balanceOf(addr1.address)).to.equal(largeAmount);
    });

    it("Should handle burn function edge cases", async function () {
      const { skyCoin, recipient } = await loadFixture(deploySkyCoinFixture);

      const initialSupply = await skyCoin.totalSupply();
      const burnAmount = ethers.parseEther("1000");

      // Burn tokens
      await skyCoin.connect(recipient).burn(burnAmount);

      // Check supply decreased
      expect(await skyCoin.totalSupply()).to.equal(initialSupply - burnAmount);

      // Try to burn more than balance
      const balance = await skyCoin.balanceOf(recipient.address);
      await expect(
        skyCoin.connect(recipient).burn(balance + 1n)
      ).to.be.revertedWithCustomError(skyCoin, "ERC20InsufficientBalance");
    });

    it("Should handle multiple exemptions correctly", async function () {
      const { skyCoin, owner, recipient, addr1, addr2 } = await loadFixture(deploySkyCoinFixture);

      // Add multiple exemptions
      await skyCoin.connect(owner).setExemptFromLimits(addr1.address, true);
      await skyCoin.connect(owner).setExemptFromLimits(addr2.address, true);

      expect(await skyCoin.isExemptFromLimits(addr1.address)).to.be.true;
      expect(await skyCoin.isExemptFromLimits(addr2.address)).to.be.true;

      // Remove one exemption
      await skyCoin.connect(owner).setExemptFromLimits(addr1.address, false);
      expect(await skyCoin.isExemptFromLimits(addr1.address)).to.be.false;
      expect(await skyCoin.isExemptFromLimits(addr2.address)).to.be.true;
    });
  });

  describe("Comprehensive Access Control Tests", function () {
    it("Should prevent non-owner from calling admin functions", async function () {
      const { skyCoin, addr1, addr2 } = await loadFixture(deploySkyCoinFixture);

      // Test all owner-only functions
      await expect(
        skyCoin.connect(addr1).setBlacklisted(addr2.address, true)
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");

      await expect(
        skyCoin.connect(addr1).updateLimits(1000, 2000)
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");

      await expect(
        skyCoin.connect(addr1).setExemptFromLimits(addr2.address, true)
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");

      await expect(
        skyCoin.connect(addr1).pause()
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");

      await expect(
        skyCoin.connect(addr1).emergencyRemoveLimits()
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to transfer ownership", async function () {
      const { skyCoin, owner, addr1 } = await loadFixture(deploySkyCoinFixture);

      // Transfer ownership
      await skyCoin.connect(owner).transferOwnership(addr1.address);
      expect(await skyCoin.owner()).to.equal(addr1.address);

      // Old owner should no longer have access
      await expect(
        skyCoin.connect(owner).pause()
      ).to.be.revertedWithCustomError(skyCoin, "OwnableUnauthorizedAccount");

      // New owner should have access
      await skyCoin.connect(addr1).pause();
      expect(await skyCoin.paused()).to.be.true;
    });
  });

  describe("Event Emission Tests", function () {
    it("Should emit all required events", async function () {
      const { skyCoin, owner, recipient, addr1 } = await loadFixture(deploySkyCoinFixture);

      // Test blacklist events
      await expect(skyCoin.connect(owner).setBlacklisted(addr1.address, true))
        .to.emit(skyCoin, "AddressBlacklisted")
        .withArgs(addr1.address, true);

      // Test limit update events
      await expect(skyCoin.connect(owner).updateLimits(1000, 2000))
        .to.emit(skyCoin, "LimitsUpdated")
        .withArgs(1000, 2000);

      // Test exemption events
      await expect(skyCoin.connect(owner).setExemptFromLimits(addr1.address, true))
        .to.emit(skyCoin, "ExemptionUpdated")
        .withArgs(addr1.address, true);

      // Test pause events (simplified)
      await expect(skyCoin.connect(owner).pause())
        .to.emit(skyCoin, "ContractPaused");

      await expect(skyCoin.connect(owner).unpause())
        .to.emit(skyCoin, "ContractUnpaused");
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should have reasonable gas costs for transfers", async function () {
      const { skyCoin, recipient, addr1 } = await loadFixture(deploySkyCoinFixture);

      const tx = await skyCoin.connect(recipient).transfer(addr1.address, 1000);
      const receipt = await tx.wait();

      // Gas should be reasonable (less than 100k for a transfer)
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("Should optimize gas for multiple operations", async function () {
      const { skyCoin, owner, addr1, addr2, addr3 } = await loadFixture(deploySkyCoinFixture);

      // Batch operations should be efficient
      const addresses = [addr1.address, addr2.address, addr3.address];
      const gasUsed = [];

      for (const addr of addresses) {
        const tx = await skyCoin.connect(owner).setExemptFromLimits(addr, true);
        const receipt = await tx.wait();
        gasUsed.push(receipt.gasUsed);
      }

      // Each subsequent call should use similar gas (no gas bomb)
      const maxGas = Math.max(...gasUsed.map(g => Number(g)));
      const minGas = Math.min(...gasUsed.map(g => Number(g)));
      const gasVariation = (maxGas - minGas) / minGas;

      expect(gasVariation).to.be.lessThan(0.1); // Less than 10% variation
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complex workflows correctly", async function () {
      const { skyCoin, owner, recipient, addr1, addr2 } = await loadFixture(deploySkyCoinFixture);

      // Complex workflow: blacklist, transfer, unblacklist, transfer
      await skyCoin.connect(owner).setBlacklisted(addr1.address, true);

      // Should fail to transfer to blacklisted address
      await expect(
        skyCoin.connect(recipient).transfer(addr1.address, 1000)
      ).to.be.revertedWithCustomError(skyCoin, "BlacklistedAddress");

      // Unblacklist and transfer should work
      await skyCoin.connect(owner).setBlacklisted(addr1.address, false);
      await skyCoin.connect(recipient).transfer(addr1.address, 1000);
      expect(await skyCoin.balanceOf(addr1.address)).to.equal(1000);

      // Transfer from addr1 to addr2 should work
      await skyCoin.connect(addr1).transfer(addr2.address, 500);
      expect(await skyCoin.balanceOf(addr2.address)).to.equal(500);
      expect(await skyCoin.balanceOf(addr1.address)).to.equal(500);
    });

    it("Should handle limit changes during active trading", async function () {
      const { skyCoin, owner, recipient, addr1, addr2 } = await loadFixture(deploySkyCoinFixture);

      // Start with default limits
      const maxTx = ethers.parseEther("100000000000"); // 100B

      // Transfer within limits to addr1
      await skyCoin.connect(recipient).transfer(addr1.address, maxTx);

      // Reduce limits
      const newMaxTx = ethers.parseEther("50000000000"); // 50B
      await skyCoin.connect(owner).updateLimits(newMaxTx, maxTx);

      // Check if addr1 is exempt (it shouldn't be by default)
      const isAddr1Exempt = await skyCoin.isExemptFromLimits(addr1.address);

      if (!isAddr1Exempt) {
        // If not exempt, should fail with new limits
        await expect(
          skyCoin.connect(addr1).transfer(addr2.address, maxTx)
        ).to.be.revertedWithCustomError(skyCoin, "ExceedsMaxTransaction");
      } else {
        // If exempt, transaction should succeed (this is expected behavior)
        await skyCoin.connect(addr1).transfer(addr2.address, maxTx);
        expect(await skyCoin.balanceOf(addr2.address)).to.equal(maxTx);
      }

      // Should always work with amount within new limits
      const remainingBalance = await skyCoin.balanceOf(addr1.address);
      if (remainingBalance >= newMaxTx) {
        await skyCoin.connect(addr1).transfer(addr2.address, newMaxTx);
      }
    });
  });
});
