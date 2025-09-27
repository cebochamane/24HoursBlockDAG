// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PredictionArena
 * @dev A simple prediction market contract for hackathon MVP
 * Users can submit one prediction each, and owner can resolve with actual value
 */
contract PredictionArena {
    
    // Entry struct to store user predictions
    struct Entry {
        int256 value;      // Scaled prediction value (e.g., ETH price * 100)
        uint256 timestamp; // When the prediction was submitted
    }
    
    // State variables
    address public owner;
    address public aiBot;
    uint256 public deadline;
    int256 public actualValue;
    bool public resolved;
    
    // Mapping to store user predictions
    mapping(address => Entry) public predictions;
    
    // Events
    event PredictionStored(address indexed user, int256 value, uint256 timestamp);
    event Resolved(int256 actualValue, uint256 timestamp);
    event DeadlineUpdated(uint256 newDeadline);
    event OwnerUpdated(address newOwner);
    event AIBotUpdated(address newAIBot);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "PredictionArena: Only owner can call this function");
        _;
    }
    
    modifier onlyBeforeDeadline() {
        require(block.timestamp < deadline, "PredictionArena: Deadline has passed");
        _;
    }
    
    modifier onlyAfterDeadline() {
        require(block.timestamp >= deadline, "PredictionArena: Deadline not yet reached");
        _;
    }
    
    modifier onlyOncePerUser() {
        require(predictions[msg.sender].timestamp == 0, "PredictionArena: User already submitted prediction");
        _;
    }
    
    modifier onlyIfNotResolved() {
        require(!resolved, "PredictionArena: Already resolved");
        _;
    }
    
    /**
     * @dev Constructor sets the initial deadline
     * @param _deadline Timestamp when predictions close
     */
    constructor(uint256 _deadline) {
        require(_deadline > block.timestamp, "PredictionArena: Deadline must be in the future");
        owner = msg.sender;
        deadline = _deadline;
    }
    
    /**
     * @dev Submit a prediction (one per user)
     * @param _value Scaled prediction value
     */
    function submitPrediction(int256 _value) external onlyBeforeDeadline onlyOncePerUser {
        predictions[msg.sender] = Entry({
            value: _value,
            timestamp: block.timestamp
        });
        
        emit PredictionStored(msg.sender, _value, block.timestamp);
    }
    
    /**
     * @dev Special function for AI bot to submit prediction
     * @param _value Scaled prediction value
     */
    function submitAIBotPrediction(int256 _value) external onlyBeforeDeadline {
        require(msg.sender == aiBot, "PredictionArena: Only AI bot can use this function");
        require(predictions[aiBot].timestamp == 0, "PredictionArena: AI bot already submitted prediction");
        
        predictions[aiBot] = Entry({
            value: _value,
            timestamp: block.timestamp
        });
        
        emit PredictionStored(aiBot, _value, block.timestamp);
    }
    
    /**
     * @dev Resolve the prediction with actual value (only owner, after deadline)
     * @param _actualValue The actual scaled value
     */
    function resolve(int256 _actualValue) external onlyOwner onlyAfterDeadline onlyIfNotResolved {
        actualValue = _actualValue;
        resolved = true;
        
        emit Resolved(_actualValue, block.timestamp);
    }
    
    /**
     * @dev Calculate absolute error for a user's prediction
     * @param user Address of the user
     * @return Absolute error (unsigned)
     */
    function absError(address user) external view returns (uint256) {
        require(resolved, "PredictionArena: Not yet resolved");
        require(predictions[user].timestamp != 0, "PredictionArena: User has no prediction");
        
        int256 error = predictions[user].value - actualValue;
        return uint256(error >= 0 ? error : -error);
    }
    
    /**
     * @dev View status for a user's prediction
     * @param user Address of the user
     * @return value The predicted value
     * @return timestamp When the prediction was submitted
     * @return isResolved Whether the prediction is resolved
     * @return actual The actual value (if resolved)
     */
    function viewStatus(address user) external view returns (
        int256 value,
        uint256 timestamp,
        bool isResolved,
        int256 actual
    ) {
        Entry memory entry = predictions[user];
        return (entry.value, entry.timestamp, resolved, actualValue);
    }
    
    /**
     * @dev Set new deadline (only owner)
     * @param _newDeadline New deadline timestamp
     */
    function setDeadline(uint256 _newDeadline) external onlyOwner {
        require(_newDeadline > block.timestamp, "PredictionArena: New deadline must be in the future");
        deadline = _newDeadline;
        emit DeadlineUpdated(_newDeadline);
    }
    
    /**
     * @dev Transfer ownership (only owner)
     * @param _newOwner New owner address
     */
    function setOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "PredictionArena: Invalid owner address");
        owner = _newOwner;
        emit OwnerUpdated(_newOwner);
    }
    
    /**
     * @dev Set AI bot address (only owner)
     * @param _aiBot New AI bot address
     */
    function setAIBot(address _aiBot) external onlyOwner {
        aiBot = _aiBot;
        emit AIBotUpdated(_aiBot);
    }
    
    /**
     * @dev Get contract summary information
     * @return ownerAddress Current owner
     * @return aiBotAddress Current AI bot
     * @return deadlineTimestamp Current deadline
     * @return isResolved Whether resolved
     * @return actualValueResult Actual value if resolved
     */
    function getInfo() external view returns (
        address ownerAddress,
        address aiBotAddress,
        uint256 deadlineTimestamp,
        bool isResolved,
        int256 actualValueResult
    ) {
        return (owner, aiBot, deadline, resolved, actualValue);
    }
}