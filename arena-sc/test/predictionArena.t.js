const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionArena", function () {
  let PredictionArena, predictionArena, owner, user1, user2, aiBot, deadline;

  beforeEach(async function () {
    [owner, user1, user2, aiBot] = await ethers.getSigners();
    const now = Math.floor(Date.now() / 1000);
    deadline = now + 60 * 60; // +1h
    PredictionArena = await ethers.getContractFactory("PredictionArena");
    predictionArena = await PredictionArena.deploy(deadline);
    await predictionArena.waitForDeployment();
  });

  describe("Deployment", function () {
    it("sets owner, deadline, resolved=false, actual=0", async function () {
      expect(await predictionArena.owner()).to.equal(owner.address);
      expect(await predictionArena.deadline()).to.equal(deadline);
      expect(await predictionArena.resolved()).to.equal(false);
      expect(await predictionArena.actualValue()).to.equal(0);
    });
  });

  describe("Submitting Predictions", function () {
    it("allows a user to submit before deadline", async function () {
      const predictionValue = 4200;
      await expect(predictionArena.connect(user1).submitPrediction(predictionValue))
        .to.emit(predictionArena, "PredictionStored");

      const entry = await predictionArena.predictions(user1.address);
      expect(entry.value).to.equal(predictionValue);
      expect(entry.timestamp).to.be.gt(0);
      expect(entry.exists).to.equal(true);
    });

    it("prevents multiple submissions", async function () {
      await predictionArena.connect(user1).submitPrediction(4200);
      await expect(
        predictionArena.connect(user1).submitPrediction(4300)
      ).to.be.revertedWithCustomError(predictionArena, "AlreadySubmitted");
    });

    it("prevents submissions after deadline", async function () {
      // jump past deadline
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 1]);
      await ethers.provider.send("evm_mine");
      await expect(
        predictionArena.connect(user1).submitPrediction(4200)
      ).to.be.revertedWithCustomError(predictionArena, "DeadlinePassed");
    });

    it("AI bot submission only for aiBot", async function () {
      await predictionArena.connect(owner).setAIBot(aiBot.address);
      await expect(predictionArena.connect(aiBot).submitAIBotPrediction(4150))
        .to.emit(predictionArena, "PredictionStored");

      await expect(
        predictionArena.connect(user1).submitAIBotPrediction(4200)
      ).to.be.revertedWithCustomError(predictionArena, "OnlyAIBot");
    });
  });

  describe("Resolving Predictions", function () {
    beforeEach(async function () {
      await predictionArena.connect(user1).submitPrediction(4200);
      await predictionArena.connect(user2).submitPrediction(4300);
    });

    it("allows owner to resolve after deadline", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 2]);
      await ethers.provider.send("evm_mine");

      await expect(predictionArena.connect(owner).resolve(4250))
        .to.emit(predictionArena, "Resolved");

      expect(await predictionArena.resolved()).to.equal(true);
      expect(await predictionArena.actualValue()).to.equal(4250);
    });

    it("prevents resolving before deadline", async function () {
      await expect(
        predictionArena.connect(owner).resolve(4250)
      ).to.be.revertedWithCustomError(predictionArena, "DeadlineNotReached");
    });

    it("prevents non-owner resolving", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 2]);
      await ethers.provider.send("evm_mine");
      await expect(
        predictionArena.connect(user1).resolve(4250)
      ).to.be.revertedWithCustomError(predictionArena, "NotOwner");
    });

    it("prevents resolving twice", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 2]);
      await ethers.provider.send("evm_mine");
      await predictionArena.connect(owner).resolve(4250);
      await expect(
        predictionArena.connect(owner).resolve(4300)
      ).to.be.revertedWithCustomError(predictionArena, "AlreadyResolved");
    });
  });

  describe("Error Calculation", function () {
    beforeEach(async function () {
      await predictionArena.connect(user1).submitPrediction(4200);
      await predictionArena.connect(user2).submitPrediction(4300);
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 2]);
      await ethers.provider.send("evm_mine");
      await predictionArena.connect(owner).resolve(4250);
    });

    it("computes absolute error", async function () {
      expect(await predictionArena.absError(user1.address)).to.equal(50);
      expect(await predictionArena.absError(user2.address)).to.equal(50);
    });

    it("reverts when not resolved", async function () {
      const later = await PredictionArena.deploy(deadline + 3600);
      await later.waitForDeployment();
      await expect(later.absError(user1.address))
        .to.be.revertedWithCustomError(later, "NotResolved");
    });

    it("reverts when user has no prediction", async function () {
      await expect(
        predictionArena.absError(aiBot.address)
      ).to.be.revertedWithCustomError(predictionArena, "NoPrediction");
    });
  });

  describe("View Status", function () {
    it("returns correct status before resolution", async function () {
      const predictionValue = 4200;
      const tx = await predictionArena.connect(user1).submitPrediction(predictionValue);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const timestamp = block.timestamp;

      const status = await predictionArena.viewStatus(user1.address);
      expect(status.value).to.equal(predictionValue);
      expect(status.timestamp).to.equal(timestamp);
      expect(status.isResolved).to.equal(false);
      expect(status.actual).to.equal(0);
    });

    it("returns correct status after resolution", async function () {
      await predictionArena.connect(user1).submitPrediction(4200);
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 2]);
      await ethers.provider.send("evm_mine");
      const actualValue = 4250;
      await predictionArena.connect(owner).resolve(actualValue);

      const status = await predictionArena.viewStatus(user1.address);
      expect(status.value).to.equal(4200);
      expect(status.isResolved).to.equal(true);
      expect(status.actual).to.equal(actualValue);
    });
  });

  describe("Admin Functions", function () {
    it("setDeadline (owner only, future)", async function () {
      const newDeadline = deadline + 3600;
      await expect(predictionArena.connect(owner).setDeadline(newDeadline))
        .to.emit(predictionArena, "DeadlineUpdated").withArgs(newDeadline);
      expect(await predictionArena.deadline()).to.equal(newDeadline);

      await expect(
        predictionArena.connect(user1).setDeadline(newDeadline + 100)
      ).to.be.revertedWithCustomError(predictionArena, "NotOwner");

      const past = Math.floor(Date.now() / 1000) - 10;
      await expect(
        predictionArena.connect(owner).setDeadline(past)
      ).to.be.revertedWithCustomError(predictionArena, "InvalidDeadline");
    });

    it("setOwner (owner only, nonzero)", async function () {
      await expect(predictionArena.connect(owner).setOwner(user1.address))
        .to.emit(predictionArena, "OwnerUpdated").withArgs(user1.address);
      expect(await predictionArena.owner()).to.equal(user1.address);

      await expect(
        predictionArena.connect(user2).setOwner(owner.address)
      ).to.be.revertedWithCustomError(predictionArena, "NotOwner");

      await expect(
        predictionArena.connect(user1).setOwner(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(predictionArena, "InvalidOwner");
    });

    it("setAIBot (owner only)", async function () {
      await expect(predictionArena.connect(owner).setAIBot(aiBot.address))
        .to.emit(predictionArena, "AIBotUpdated").withArgs(aiBot.address);
      expect(await predictionArena.aiBot()).to.equal(aiBot.address);

      await expect(
        predictionArena.connect(user1).setAIBot(aiBot.address)
      ).to.be.revertedWithCustomError(predictionArena, "NotOwner");
    });
  });

  describe("Get Info", function () {
    it("returns correct info", async function () {
      await predictionArena.connect(owner).setAIBot(aiBot.address);
      const info = await predictionArena.getInfo();
      expect(info.ownerAddress).to.equal(owner.address);
      expect(info.aiBotAddress).to.equal(aiBot.address);
      expect(info.deadlineTimestamp).to.equal(deadline);
      expect(info.isResolved).to.equal(false);
      expect(info.actualValueResult).to.equal(0);
    });
  });
});
