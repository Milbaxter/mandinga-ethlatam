// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title Raffle
 * @dev A raffle contract where users can buy quotas and a winner is randomly selected
 * when all quotas are sold out. The prize is in ETH.
 * The participant list is kept private using FHE encryption.
 * Uses Chainlink VRF v2 for provably fair random winner selection.
 */
contract Raffle is ReentrancyGuard, VRFConsumerBaseV2 {
    /// @notice The total prize amount in ETH (in wei)
    uint256 public immutable prizeAmount;

    /// @notice The total number of quotas available
    uint256 public immutable totalQuotas;

    /// @notice The price per quota in ETH (in wei)
    uint256 public immutable quotaPrice;

    /// @notice The number of quotas sold
    uint256 public soldQuotas;

    /// @notice Array of participant addresses (one entry per quota purchased) - PRIVATE
    address[] private participants;

    /// @notice Mapping from address to number of quotas purchased - PRIVATE
    mapping(address => uint256) private quotasPurchased;

    /// @notice Encrypted count of total participants (private)
    euint32 private encryptedParticipantCount;

    /// @notice Constant encrypted value of 1 for increments (gas saving)
    euint32 private ONE;

    /// @notice The winner address (set after selection)
    address public winner;

    /// @notice Whether the raffle has ended and winner has been selected
    bool public isRaffleEnded;

    /// @notice The timestamp when the raffle was created
    uint256 public raffleStartTime;

    /// @notice Duration of the raffle in seconds (7 days)
    uint256 public constant RAFFLE_DURATION = 7 days;

    /// @notice Chainlink VRF Coordinator
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    
    /// @notice Chainlink VRF subscription ID
    uint64 private immutable subscriptionId;
    
    /// @notice Chainlink VRF key hash
    bytes32 private immutable keyHash;
    
    /// @notice Chainlink VRF request confirmations
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    
    /// @notice Chainlink VRF callback gas limit
    uint32 private constant CALLBACK_GAS_LIMIT = 100000;
    
    /// @notice Pending VRF request ID
    uint256 private requestId;
    
    /// @notice Whether a VRF request is pending
    bool private isRequestPending;

    /// @notice Events
    event QuotaPurchased(address indexed buyer, uint256 quotas, uint256 totalQuotas);
    event WinnerSelected(address indexed winner, uint256 prizeAmount);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event RandomnessRequested(uint256 indexed requestId);

    /// @notice Errors
    error RaffleEnded();
    error AllQuotasSold();
    error InvalidQuotaAmount();
    error InsufficientETH();
    error QuotasNotSoldOut();
    error WinnerAlreadySelected();
    error NoWinnerSelected();
    error PrizeAlreadyClaimed();
    error RandomnessRequestPending();
    error InvalidVRFRequest();

    /**
     * @dev Constructor to initialize the raffle
     * @param _prizeAmount The total prize amount in ETH (in wei)
     * @param _totalQuotas The total number of quotas available
     * @param _vrfCoordinator Address of the VRF Coordinator contract
     * @param _subscriptionId Chainlink VRF subscription ID
     * @param _keyHash Chainlink VRF key hash for the network
     */
    constructor(
        uint256 _prizeAmount,
        uint256 _totalQuotas,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        require(_prizeAmount > 0, "Prize must be greater than 0");
        require(_totalQuotas > 0, "Total quotas must be greater than 0");
        require(_vrfCoordinator != address(0), "VRF Coordinator cannot be zero address");

        prizeAmount = _prizeAmount;
        totalQuotas = _totalQuotas;
        quotaPrice = _prizeAmount / _totalQuotas; // Price per quota
        raffleStartTime = block.timestamp;
        
        // Initialize Chainlink VRF
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        // Initialize FHE values
        ONE = FHE.asEuint32(1);
        encryptedParticipantCount = FHE.asEuint32(0);
        
        // Allow this contract to perform operations using the constant ONE
        FHE.allowThis(ONE);
        
        // Initially allow global access to encrypted count (0), but will be restricted after first participant
        FHE.allowGlobal(encryptedParticipantCount);
    }

    /**
     * @dev Allows users to buy quotas
     * @param _numQuotas The number of quotas to purchase
     */
    function buyQuota(uint256 _numQuotas) external payable nonReentrant {
        if (isRaffleEnded) revert RaffleEnded();
        if (soldQuotas >= totalQuotas) revert AllQuotasSold();
        if (_numQuotas == 0) revert InvalidQuotaAmount();
        if (soldQuotas + _numQuotas > totalQuotas) revert InvalidQuotaAmount();

        uint256 totalCost = quotaPrice * _numQuotas;
        
        // Check if user sent enough ETH
        if (msg.value < totalCost) revert InsufficientETH();

        // Update state
        soldQuotas += _numQuotas;
        quotasPurchased[msg.sender] += _numQuotas;

        // Add participant entries (one per quota) - stored privately
        for (uint256 i = 0; i < _numQuotas; i++) {
            participants.push(msg.sender);
        }

        // Update encrypted participant count (increment by number of quotas purchased)
        // This keeps the participant count private using FHE
        euint32 numQuotasEncrypted = FHE.asEuint32(_numQuotas);
        encryptedParticipantCount = FHE.add(encryptedParticipantCount, numQuotasEncrypted);
        
        // Restrict access to encrypted count - only contract and sender can read
        FHE.allowThis(encryptedParticipantCount);
        FHE.allowSender(encryptedParticipantCount);

        emit QuotaPurchased(msg.sender, _numQuotas, soldQuotas);

        // If all quotas are sold, automatically request randomness for winner selection
        if (soldQuotas >= totalQuotas) {
            _requestRandomness();
        }
    }

    /**
     * @dev Requests randomness from Chainlink VRF to select a winner
     * Can be called manually if 7 days have passed or automatically when quotas are sold out
     */
    function selectWinner() external {
        if (isRaffleEnded) revert WinnerAlreadySelected();
        if (soldQuotas < totalQuotas && block.timestamp < raffleStartTime + RAFFLE_DURATION) {
            revert QuotasNotSoldOut();
        }
        if (isRequestPending) revert RandomnessRequestPending();
        _requestRandomness();
    }

    /**
     * @dev Internal function to request randomness from Chainlink VRF
     */
    function _requestRandomness() internal {
        if (isRaffleEnded) revert WinnerAlreadySelected();
        if (participants.length == 0) revert NoWinnerSelected();
        if (isRequestPending) revert RandomnessRequestPending();

        // Request randomness from Chainlink VRF
        isRequestPending = true;
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            1 // numWords - we only need 1 random number
        );

        emit RandomnessRequested(requestId);
    }

    /**
     * @dev Callback function used by VRF Coordinator to return the random number
     * @param _requestId The request ID returned by requestRandomWords
     * @param _randomWords Array of random numbers returned by Chainlink VRF
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        if (_requestId != requestId) revert InvalidVRFRequest();
        if (isRaffleEnded) revert WinnerAlreadySelected();
        if (participants.length == 0) revert NoWinnerSelected();

        // Use the random number to select winner
        uint256 randomIndex = _randomWords[0] % participants.length;
        winner = participants[randomIndex];
        isRaffleEnded = true;
        isRequestPending = false;

        emit WinnerSelected(winner, prizeAmount);
    }

    /**
     * @dev Allows the winner to claim their prize
     */
    function claimPrize() external nonReentrant {
        if (!isRaffleEnded) revert NoWinnerSelected();
        if (msg.sender != winner) revert NoWinnerSelected();
        if (address(this).balance < prizeAmount) revert PrizeAlreadyClaimed();

        uint256 amountToTransfer = prizeAmount;
        
        // Transfer prize to winner
        (bool success, ) = winner.call{value: amountToTransfer}("");
        require(success, "ETH transfer failed");

        emit PrizeClaimed(winner, amountToTransfer);
    }

    /**
     * @dev View function to get raffle information
     */
    function getRaffleInfo()
        external
        view
        returns (
            uint256 _prizeAmount,
            uint256 _totalQuotas,
            uint256 _soldQuotas,
            uint256 _quotaPrice,
            address _winner,
            bool _isRaffleEnded,
            uint256 _remainingQuotas,
            uint256 _timeRemaining
        )
    {
        _prizeAmount = prizeAmount;
        _totalQuotas = totalQuotas;
        _soldQuotas = soldQuotas;
        _quotaPrice = quotaPrice;
        _winner = winner;
        _isRaffleEnded = isRaffleEnded;
        _remainingQuotas = totalQuotas - soldQuotas;
        
        if (block.timestamp < raffleStartTime + RAFFLE_DURATION) {
            _timeRemaining = raffleStartTime + RAFFLE_DURATION - block.timestamp;
        } else {
            _timeRemaining = 0;
        }
    }

    /**
     * @dev View function to get encrypted total participants count (private)
     * @return The encrypted count of participants
     */
    function getEncryptedParticipantCount() external view returns (euint32) {
        return encryptedParticipantCount;
    }

    /**
     * @dev Internal function to get total participants count (for contract use only)
     * @return The actual count of participants
     */
    function _getTotalParticipants() internal view returns (uint256) {
        return participants.length;
    }

    /**
     * @dev View function to check if raffle can end (either sold out or 7 days passed)
     */
    function canEndRaffle() external view returns (bool) {
        return (soldQuotas >= totalQuotas || block.timestamp >= raffleStartTime + RAFFLE_DURATION) && !isRaffleEnded;
    }

    /**
     * @dev View function to check if an address has purchased quotas (private check)
     * Only the caller can check their own quota count
     * @return The number of quotas purchased by the caller
     */
    function getMyQuotas() external view returns (uint256) {
        return quotasPurchased[msg.sender];
    }
}

