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

 
});