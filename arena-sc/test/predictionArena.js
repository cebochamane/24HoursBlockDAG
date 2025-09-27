const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionArena", function () {
  let PredictionArena;
  let predictionArena;
  let owner;
  let user1;
  let user2;
  let aiBot;
  let deadline;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, aiBot] = await ethers.getSigners();
    
    // Set deadline to 1 hour from now for testing
    const currentTimestamp = Math.floor(Date.now() / 1000);
    deadline = currentTimestamp + (60 * 60); // 1 hour in seconds
    
    // Deploy contract
    PredictionArena = await ethers.getContractFactory("PredictionArena");
    predictionArena = await PredictionArena.deploy(deadline);
    await predictionArena.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await predictionArena.owner()).to.equal(owner.address);
    });

    it("Should set the correct deadline", async function () {
      expect(await predictionArena.deadline()).to.equal(deadline);
    });

    it("Should not be resolved initially", async function () {
      expect(await predictionArena.resolved()).to.be.false;
    });

    it("Should have actual value of 0 initially", async function () {
      expect(await predictionArena.actualValue()).to.equal(0);
    });
  });

  describe("Submitting Predictions", function () {
    it("Should allow users to submit predictions before deadline", async function () {
      const predictionValue = 4200; // ETH price * 100
      
      await expect(predictionArena.connect(user1).submitPrediction(predictionValue))
        .to.emit(predictionArena, "PredictionStored")
        .withArgs(user1.address, predictionValue, await ethers.provider.getBlock("latest").then(b => b.timestamp));
      
      const entry = await predictionArena.predictions(user1.address);
      expect(entry.value).to.equal(predictionValue);
      expect(entry.timestamp).to.be.gt(0);
    });

    it("Should prevent users from submitting multiple predictions", async function () {
      const predictionValue = 4200;
      
      await predictionArena.connect(user1).submitPrediction(predictionValue);
      
      await expect(
        predictionArena.connect(user1).submitPrediction(4300)
      ).to.be.revertedWith("PredictionArena: User already submitted prediction");
    });

    it("Should prevent submissions after deadline", async function () {
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [deadline - Math.floor(Date.now() / 1000) + 100]);
      await ethers.provider.send("evm_mine");
      
      await expect(
        predictionArena.connect(user1).submitPrediction(4200)
      ).to.be.revertedWith("PredictionArena: Deadline has passed");
    });

    it("Should allow AI bot to submit prediction when set", async function () {
      // Set AI bot address
      await predictionArena.setAIBot(aiBot.address);
      
      const predictionValue = 4150;
      
      await expect(predictionArena.connect(aiBot).submitAIBotPrediction(predictionValue))
        .to.emit(predictionArena, "PredictionStored")
        .withArgs(aiBot.address, predictionValue, await ethers.provider.getBlock("latest").then(b => b.timestamp));
    });

    it("Should prevent non-AI bot from using AI bot function", async function () {
      await predictionArena.setAIBot(aiBot.address);
      
      await expect(
        predictionArena.connect(user1).submitAIBotPrediction(4200)
      ).to.be.revertedWith("PredictionArena: Only AI bot can use this function");
    });
  });

  describe("Resolving Predictions", function () {
    beforeEach(async function () {
      // Submit some predictions
      await predictionArena.connect(user1).submitPrediction(4200);
      await predictionArena.connect(user2).submitPrediction(4300);
    });

    it("Should allow owner to resolve after deadline", async function () {
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [deadline - Math.floor(Date.now() / 1000) + 100]);
      await ethers.provider.send("evm_mine");
      
      const actualValue = 4250;
      
      await expect(predictionArena.connect(owner).resolve(actualValue))
        .to.emit(predictionArena, "Resolved")
        .withArgs(actualValue, await ethers.provider.getBlock("latest").then(b => b.timestamp));
      
      expect(await predictionArena.resolved()).to.be.true;
      expect(await predictionArena.actualValue()).to.equal(actualValue);
    });

    it("Should prevent resolving before deadline", async function () {
      await expect(
        predictionArena.connect(owner).resolve(4250)
      ).to.be.revertedWith("PredictionArena: Deadline not yet reached");
    });

    it("Should prevent non-owner from resolving", async function () {
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [deadline - Math.floor(Date.now() / 1000) + 100]);
      await ethers.provider.send("evm_mine");
      
      await expect(
        predictionArena.connect(user1).resolve(4250)
      ).to.be.revertedWith("PredictionArena: Only owner can call this function");
    });

    it("Should prevent resolving twice", async function () {
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [deadline - Math.floor(Date.now() / 1000) + 100]);
      await ethers.provider.send("evm_mine");
      
      await predictionArena.connect(owner).resolve(4250);
      
      await expect(
        predictionArena.connect(owner).resolve(4300)
      ).to.be.revertedWith("PredictionArena: Already resolved");
    });
  });

  describe("Error Calculation", function () {
    beforeEach(async function () {
      // Submit predictions
      await predictionArena.connect(user1).submitPrediction(4200); // Error: 50
      await predictionArena.connect(user2).submitPrediction(4300); // Error: 50
      
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [deadline - Math.floor(Date.now() / 1000) + 100]);
      await ethers.provider.send("evm_mine");
      
      // Resolve with actual value
      await predictionArena.connect(owner).resolve(4250);
    });

    it("Should calculate absolute error correctly", async function () {
      expect(await predictionArena.absError(user1.address)).to.equal(50);
      expect(await predictionArena.absError(user2.address)).to.equal(50);
    });

    it("Should revert when calculating error for unresolved prediction", async function () {
      const newContract = await PredictionArena.deploy(deadline + 3600);
      await newContract.waitForDeployment();
      
      await expect(
        newContract.absError(user1.address)
      ).to.be.revertedWith("PredictionArena: Not yet resolved");
    });

    it("Should revert when calculating error for user with no prediction", async function () {
      await expect(
        predictionArena.absError(aiBot.address)
      ).to.be.revertedWith("PredictionArena: User has no prediction");
    });
  });

  describe("View Status", function () {
    it("Should return correct status for user with prediction", async function () {
      const predictionValue = 4200;
      const tx = await predictionArena.connect(user1).submitPrediction(predictionValue);
      const receipt = await tx.wait();
      const timestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;
      
      const status = await predictionArena.viewStatus(user1.address);
      
      expect(status.value).to.equal(predictionValue);
      expect(status.timestamp).to.equal(timestamp);
      expect(status.isResolved).to.be.false;
      expect(status.actual).to.equal(0);
    });

    it("Should return correct status after resolution", async function () {
      await predictionArena.connect(user1).submitPrediction(4200);
      
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [deadline - Math.floor(Date.now() / 1000) + 100]);
      await ethers.provider.send("evm_mine");
      
      const actualValue = 4250;
      await predictionArena.connect(owner).resolve(actualValue);
      
      const status = await predictionArena.viewStatus(user1.address);
      
      expect(status.value).to.equal(4200);
      expect(status.isResolved).to.be.true;
      expect(status.actual).to.equal(actualValue);
    });
  });

  describe("Admin Functions", function () {
    describe("setDeadline", function () {
      it("Should allow owner to set new deadline", async function () {
        const newDeadline = deadline + 3600; // 1 hour later
        
        await expect(predictionArena.connect(owner).setDeadline(newDeadline))
          .to.emit(predictionArena, "DeadlineUpdated")
          .withArgs(newDeadline);
        
        expect(await predictionArena.deadline()).to.equal(newDeadline);
      });

      it("Should prevent non-owner from setting deadline", async function () {
        await expect(
          predictionArena.connect(user1).setDeadline(deadline + 3600)
        ).to.be.revertedWith("PredictionArena: Only owner can call this function");
      });

      it("Should prevent setting deadline in the past", async function () {
        const pastDeadline = Math.floor(Date.now() / 1000) - 100;
        
        await expect(
          predictionArena.connect(owner).setDeadline(pastDeadline)
        ).to.be.revertedWith("PredictionArena: New deadline must be in the future");
      });
    });

    describe("setOwner", function () {
      it("Should allow owner to transfer ownership", async function () {
        await expect(predictionArena.connect(owner).setOwner(user1.address))
          .to.emit(predictionArena, "OwnerUpdated")
          .withArgs(user1.address);
        
        expect(await predictionArena.owner()).to.equal(user1.address);
      });

      it("Should prevent non-owner from transferring ownership", async function () {
        await expect(
          predictionArena.connect(user1).setOwner(user2.address)
        ).to.be.revertedWith("PredictionArena: Only owner can call this function");
      });

      it("Should prevent setting zero address as owner", async function () {
        await expect(
          predictionArena.connect(owner).setOwner(ethers.ZeroAddress)
        ).to.be.revertedWith("PredictionArena: Invalid owner address");
      });
    });

    describe("setAIBot", function () {
      it("Should allow owner to set AI bot address", async function () {
        await expect(predictionArena.connect(owner).setAIBot(aiBot.address))
          .to.emit(predictionArena, "AIBotUpdated")
          .withArgs(aiBot.address);
        
        expect(await predictionArena.aiBot()).to.equal(aiBot.address);
      });

      it("Should prevent non-owner from setting AI bot", async function () {
        await expect(
          predictionArena.connect(user1).setAIBot(aiBot.address)
        ).to.be.revertedWith("PredictionArena: Only owner can call this function");
      });
    });
  });

  describe("Get Info", function () {
    it("Should return correct contract information", async function () {
      await predictionArena.setAIBot(aiBot.address);
      
      const info = await predictionArena.getInfo();
      
      expect(info.ownerAddress).to.equal(owner.address);
      expect(info.aiBotAddress).to.equal(aiBot.address);
      expect(info.deadlineTimestamp).to.equal(deadline);
      expect(info.isResolved).to.be.false;
      expect(info.actualValueResult).to.equal(0);
    });
  });
});