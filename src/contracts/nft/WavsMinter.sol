// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IWavsNftServiceTypes} from "interfaces/IWavsNftServiceTypes.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";

/**
 * @title Minter
 * @notice Contract for minting AI-generated NFTs through the WAVS system
 */
contract WavsMinter is Ownable, ReentrancyGuard, IWavsServiceHandler {
    // Config parameters
    uint256 public mintPrice = 0.1 ether;

    // Mapping to store additional metadata for each trigger
    mapping(IWavsNftServiceTypes.TriggerId => Receipt) public receipts;

    // Interface to the WAVS service manager
    IWavsServiceManager public serviceManager;

    // Auto-incrementing trigger ID counter
    IWavsNftServiceTypes.TriggerId public nextTriggerId;

    // Address of the funds recipient
    address public fundsRecipient;

    // Structure to hold metadata about the trigger
    struct Receipt {
        address creator;
        string prompt;
        IWavsNftServiceTypes.WavsTriggerType wavsTriggerType;
        bool fulfilled;
        uint256 mintPrice;
    }

    // Event emitted when a mint/update is triggered
    event WavsNftTrigger(
        address indexed sender, string prompt, uint64 indexed triggerId, uint8 wavsTriggerType, uint256 tokenId
    );

    // Event emitted when a mint is fulfilled
    event MintFulfilled(IWavsNftServiceTypes.TriggerId indexed triggerId);

    // Event emitted when mint price is updated
    event MintPriceUpdated(uint256 newPrice);

    constructor(address _serviceManager, address _fundsRecipient) Ownable(msg.sender) {
        require(_serviceManager != address(0), "Invalid service manager address");
        require(_fundsRecipient != address(0), "Invalid funds recipient address");
        serviceManager = IWavsServiceManager(_serviceManager);
        fundsRecipient = _fundsRecipient;
    }

    /**
     * @notice Trigger an AVS-generated NFT mint
     * @param prompt The text prompt for AI generation
     */
    function triggerMint(string calldata prompt)
        external
        payable
        nonReentrant
        returns (IWavsNftServiceTypes.TriggerId)
    {
        // Clearer error message for insufficient payment
        require(msg.value >= mintPrice, "Insufficient payment: Please send at least the mint price");

        // Get the next trigger ID and increment the counter
        IWavsNftServiceTypes.TriggerId triggerId = nextTriggerId;
        nextTriggerId = IWavsNftServiceTypes.TriggerId.wrap(IWavsNftServiceTypes.TriggerId.unwrap(nextTriggerId) + 1);

        // Refund any excess payment
        uint256 excess = msg.value - mintPrice;
        if (excess > 0) {
            (bool refundSuccess,) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "Failed to refund excess");
        }

        // Store metadata for this mint request
        receipts[triggerId] = Receipt({
            creator: msg.sender,
            prompt: prompt,
            wavsTriggerType: IWavsNftServiceTypes.WavsTriggerType.MINT,
            fulfilled: false,
            mintPrice: mintPrice
        });

        // Emit the WavsNftTrigger event
        emit WavsNftTrigger(
            msg.sender,
            prompt,
            IWavsNftServiceTypes.TriggerId.unwrap(triggerId),
            uint8(IWavsNftServiceTypes.WavsTriggerType.MINT),
            0 // tokenId is 0 for mints, the AVS ignores this value for minting
        );

        return triggerId;
    }

    /// @inheritdoc IWavsServiceHandler
    function handleSignedEnvelope(Envelope calldata envelope, SignatureData calldata signatureData) external {
        serviceManager.validate(envelope, signatureData);

        IWavsNftServiceTypes.TriggerId triggerId = abi.decode(envelope.payload, (IWavsNftServiceTypes.TriggerId));

        // Check if the trigger exists and is not already fulfilled
        require(receipts[triggerId].creator != address(0), "Trigger does not exist");
        require(!receipts[triggerId].fulfilled, "Trigger already fulfilled");

        // Mark the trigger as fulfilled
        receipts[triggerId].fulfilled = true;

        // Send the mint price to the funds recipient
        (bool success,) = payable(fundsRecipient).call{value: receipts[triggerId].mintPrice}("");
        require(success, "Failed to send mint price to funds recipient");

        // Emit the fulfillment event
        emit MintFulfilled(triggerId);
    }

    /**
     * @notice Update the mint price (owner only)
     * @param newPrice The new mint price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    /**
     * @notice Sets the address that receives mint fees
     * @param newRecipient The new funds recipient address
     */
    function setFundsRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid funds recipient");
        fundsRecipient = newRecipient;
    }

    /**
     * @notice Get metadata for a trigger
     * @param triggerId The trigger ID to query
     * @return The trigger metadata struct
     */
    function getTrigger(IWavsNftServiceTypes.TriggerId triggerId) external view returns (Receipt memory) {
        return receipts[triggerId];
    }
}
