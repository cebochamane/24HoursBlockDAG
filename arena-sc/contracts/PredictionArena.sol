// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PredictionArena
 * @notice Simple one-shot prediction contest:
 *  - Users submit exactly one prediction before `deadline`
 *  - (Optional) AI bot can submit via a separate function if configured
 *  - Owner resolves after the deadline by setting `actualValue`
 *  - Frontend can compute absolute errors via `absError()`
 */
contract PredictionArena {
    struct Entry {
        int256 value;
        uint256 timestamp;
        bool exists;
    }

    address public owner;
    address public aiBot;
    uint256 public deadline;
    bool public resolved;
    int256 public actualValue;

    mapping(address => Entry) public predictions;

    event PredictionStored(address indexed user, int256 value, uint256 timestamp);
    event Resolved(int256 actualValue, uint256 timestamp);
    event DeadlineUpdated(uint256 newDeadline);
    event OwnerUpdated(address newOwner);
    event AIBotUpdated(address newAIBot);

    error NotOwner();
    error OnlyAIBot();
    error AlreadySubmitted();
    error DeadlinePassed();
    error DeadlineNotReached();
    error AlreadyResolved();
    error NoPrediction();
    error NotResolved();
    error InvalidOwner();
    error InvalidDeadline();

    /**
     * @param _deadline UNIX timestamp after which submissions are blocked
     */
    constructor(uint256 _deadline) {
        if (_deadline <= block.timestamp) revert InvalidDeadline();
        owner = msg.sender;
        deadline = _deadline;
        resolved = false;
        actualValue = 0;
    }

    // --------- User functions ---------

    /**
     * @notice Submit a prediction before the deadline
     * @param value scaled integer (e.g., price * 100)
     */
    function submitPrediction(int256 value) external {
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (predictions[msg.sender].exists) revert AlreadySubmitted();

        predictions[msg.sender] = Entry({
            value: value,
            timestamp: block.timestamp,
            exists: true
        });

        emit PredictionStored(msg.sender, value, block.timestamp);
    }

    /**
     * @notice AI bot submits when aiBot is set and before deadline
     */
    function submitAIBotPrediction(int256 value) external {
        if (msg.sender != aiBot) revert OnlyAIBot();
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (predictions[msg.sender].exists) revert AlreadySubmitted();

        predictions[msg.sender] = Entry({
            value: value,
            timestamp: block.timestamp,
            exists: true
        });

        emit PredictionStored(msg.sender, value, block.timestamp);
    }

    // --------- Resolution ---------

    /**
     * @notice Owner sets the actual value after the deadline
     */
    function resolve(int256 _actualValue) external {
        if (msg.sender != owner) revert NotOwner();
        if (block.timestamp <= deadline) revert DeadlineNotReached();
        if (resolved) revert AlreadyResolved();

        resolved = true;
        actualValue = _actualValue;

        emit Resolved(_actualValue, block.timestamp);
    }

    // --------- Views ---------

    /**
     * @notice Absolute error for an address’s prediction vs actual
     */
    function absError(address user) external view returns (uint256) {
        if (!resolved) revert NotResolved();
        Entry memory e = predictions[user];
        if (!e.exists) revert NoPrediction();
        unchecked {
            return _absDiff(e.value, actualValue);
        }
    }

    function _absDiff(int256 a, int256 b) internal pure returns (uint256) {
        int256 d = a - b;
        return uint256(d >= 0 ? d : -d);
    }

    /**
     * @notice View status for a user in a single call
     */
    function viewStatus(address user)
        external
        view
        returns (
            int256 value,
            uint256 timestamp,
            bool isResolved,
            int256 actual
        )
    {
        Entry memory e = predictions[user];
        value = e.value;
        timestamp = e.timestamp;
        isResolved = resolved;
        actual = actualValue;
    }

    /**
     * @notice Summary for FE
     */
    function getInfo()
        external
        view
        returns (
            address ownerAddress,
            address aiBotAddress,
            uint256 deadlineTimestamp,
            bool isResolved,
            int256 actualValueResult
        )
    {
        return (owner, aiBot, deadline, resolved, actualValue);
    }

    // --------- Admin ---------

    function setDeadline(uint256 newDeadline) external {
        if (msg.sender != owner) revert NotOwner();
        if (newDeadline <= block.timestamp) revert InvalidDeadline();
        deadline = newDeadline;
        emit DeadlineUpdated(newDeadline);
    }

    function setOwner(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        if (newOwner == address(0)) revert InvalidOwner();
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    function setAIBot(address newAIBot) external {
        if (msg.sender != owner) revert NotOwner();
        aiBot = newAIBot;
        emit AIBotUpdated(newAIBot);
    }
}
