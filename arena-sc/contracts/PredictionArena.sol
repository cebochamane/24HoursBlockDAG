// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PredictionArena (MVP) — one-round prediction league with on-chain storage
/// @notice Constructor only takes deadline (AI bot can be set later via setAIBot).
contract PredictionArena {
    struct Entry {
        int256 value;       // scaled price (e.g., *100 for 2 decimals)
        uint256 timestamp;  // block.timestamp at submission
    }

    address public owner;
    address public aiBot;         // optional: set by owner (0 address = disabled)
    uint256 public deadline;      // unix seconds: last moment to submit
    bool    public resolved;
    int256  public actualValue;   // scaled actual value after resolve

    mapping(address => Entry) public predictions;

    // Events
    event PredictionStored(address indexed user, int256 value, uint256 timestamp);
    event Resolved(int256 actual, uint256 timestamp);
    event OwnerUpdated(address indexed newOwner);
    event AIBotUpdated(address indexed newBot);
    event DeadlineUpdated(uint256 newDeadline);

    // Custom errors (gas friendly)
    error NotOwner();
    error AlreadySubmitted();
    error DeadlinePassed();
    error DeadlineNotReached();
    error AlreadyResolved();
    error NotResolved();
    error NoPrediction();
    error NotAI();
    error InvalidOwner();

    constructor(uint256 _deadline) {
        require(_deadline > block.timestamp, "deadline too soon");
        owner = msg.sender;
        deadline = _deadline;
        resolved = false;
        actualValue = 0;
    }

    // -------- Core flow --------

    /// @notice Human prediction; each user can submit once before deadline
    function submitPrediction(int256 value) external {
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (predictions[msg.sender].timestamp != 0) revert AlreadySubmitted();
        predictions[msg.sender] = Entry(value, block.timestamp);
        emit PredictionStored(msg.sender, value, block.timestamp);
    }

    /// @notice Optional: AI bot writes on-chain too (if configured)
    function submitAIBotPrediction(int256 value) external {
        if (msg.sender != aiBot) revert NotAI();
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (predictions[msg.sender].timestamp != 0) revert AlreadySubmitted();
        predictions[msg.sender] = Entry(value, block.timestamp);
        emit PredictionStored(msg.sender, value, block.timestamp);
    }

    /// @notice Owner resolves with actual scaled value after deadline
    function resolve(int256 actualScaled) external {
        if (msg.sender != owner) revert NotOwner();
        if (resolved) revert AlreadyResolved();
        if (block.timestamp <= deadline) revert DeadlineNotReached();
        resolved = true;
        actualValue = actualScaled;
        emit Resolved(actualScaled, block.timestamp);
    }

    /// @notice Absolute error for a user (valid after resolve)
    function absError(address user) external view returns (uint256) {
        if (!resolved) revert NotResolved();
        Entry memory e = predictions[user];
        if (e.timestamp == 0) revert NoPrediction();
        int256 diff = e.value - actualValue;
        return uint256(diff >= 0 ? diff : -diff);
    }

    /// @notice FE helper — returns (value, ts, resolved?, actual)
    function viewStatus(address user) external view returns (
        int256 value,
        uint256 timestamp,
        bool isResolved,
        int256 actual
    ) {
        Entry memory e = predictions[user];
        return (e.value, e.timestamp, resolved, actualValue);
    }

    /// @notice Convenience getter for dashboards
    function getInfo() external view returns (
        address ownerAddress,
        address aiBotAddress,
        uint256 deadlineTimestamp,
        bool isResolved,
        int256 actualValueResult
    ) {
        return (owner, aiBot, deadline, resolved, actualValue);
    }

    // -------- Admin (demo niceties) --------

    function setOwner(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        if (newOwner == address(0)) revert InvalidOwner();
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    function setAIBot(address newBot) external {
        if (msg.sender != owner) revert NotOwner();
        aiBot = newBot; // can be 0x0 to disable
        emit AIBotUpdated(newBot);
    }

    function setDeadline(uint256 newDeadline) external {
        if (msg.sender != owner) revert NotOwner();
        if (newDeadline <= block.timestamp) revert DeadlineNotReached();
        deadline = newDeadline;
        emit DeadlineUpdated(newDeadline);
    }
}
