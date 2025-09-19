// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IWavsServiceHandler} from "@wavs/src/eigenlayer/ecdsa/interfaces/IWavsServiceHandler.sol";

/// @title UniqueEnvelope - Helper contract to ensure envelopes are unique.
abstract contract UniqueEnvelope is IWavsServiceHandler {
    /**
     * @notice The event for the pruned expired envelopes.
     * @param count The count of the pruned expired envelopes.
     */
    event PrunedExpiredEnvelopes(uint256 count);

    /// @notice The error for the envelope expired.
    error EnvelopeExpired();

    /// @notice The error for the envelope already seen.
    error EnvelopeAlreadySeen();

    /// @notice The expiration time for an envelope.
    uint256 public constant ENVELOPE_EXPIRATION_TIME = 5 minutes;

    /// @notice The expiration time for each envelope we've seen.
    mapping(bytes20 eventId => uint256 expiresAt) public envelopesSeen;

    /// @notice The eventIds in a queue, with start and end indexes tracked, to allow efficient iteration and pruning of expired envelopes.
    mapping(uint256 index => bytes20 eventId) public envelopeExpirationQueue;

    /// @notice The start index of the envelope expiration queue.
    uint256 public envelopeExpirationQueueStart = 0;

    /// @notice The end index of the envelope expiration queue.
    uint256 public envelopeExpirationQueueEnd = 0;

    /// @notice Ensure the envelope is unique and not expired, reverting if so.
    function _validateUniqueEnvelope(
        Envelope memory envelope,
        uint256 expiresAt
    ) internal {
        // Ensure envelope is not expired. If expired, it may have been seen before and then cleaned up, so we need to check this BEFORE we check if the eventId has been seen.
        if (!(expiresAt > block.timestamp)) {
            revert EnvelopeExpired();
        }

        // Ensure eventId has not yet been seen.
        if (envelopesSeen[envelope.eventId] > 0) {
            revert EnvelopeAlreadySeen();
        }

        // Mark envelope as seen and add it to the expiration queue.
        _markEnvelopeSeen(envelope.eventId, expiresAt);
    }

    /**
     * @notice Mark an envelope as seen and add it to the expiration queue.
     * @param eventId The eventId of the envelope.
     * @param expiresAt The timestamp at which the envelope expires.
     */
    function _markEnvelopeSeen(bytes20 eventId, uint256 expiresAt) internal {
        envelopesSeen[eventId] = expiresAt;
        envelopeExpirationQueue[envelopeExpirationQueueEnd] = eventId;
        ++envelopeExpirationQueueEnd;
    }

    /**
     * @notice Remove the first envelope from the expiration queue if it's expired.
     * @return success Whether the first envelope in the queue was expired and removed.
     */
    function _removeFirstEnvelopeIfExpired() internal returns (bool) {
        bytes20 eventId = envelopeExpirationQueue[envelopeExpirationQueueStart];
        uint256 expiresAt = envelopesSeen[eventId];

        // If envelope is NOT expired, do nothing and return false.
        if (expiresAt > block.timestamp) {
            return false;
        }

        // Remove envelope from the queue and increment the start index.
        delete envelopesSeen[eventId];
        delete envelopeExpirationQueue[envelopeExpirationQueueStart];
        ++envelopeExpirationQueueStart;

        return true;
    }

    /**
     * @notice Prune expired envelopes.
     * @dev Prune up to the first N envelopes from the seen queue, stopping before the first non-expired envelope. We need to prune envelopes in sequence to avoid missing any envelopes.
     * @param max The maximum number of envelopes to prune.
     * @return The number of envelopes pruned.
     */
    function _pruneExpiredEnvelopes(uint256 max) internal returns (uint256) {
        // Cap the max to the size of the queue.
        uint256 size = envelopeExpirationQueueSize();
        if (max > size) {
            max = size;
        }

        // Remove up to max expired envelopes from the queue, stopping if we hit a non-expired envelope.
        uint256 pruned = 0;
        while (pruned < max) {
            bool expiredAndRemoved = _removeFirstEnvelopeIfExpired();
            if (expiredAndRemoved) {
                ++pruned;
            } else {
                break;
            }
        }

        emit PrunedExpiredEnvelopes(pruned);

        return pruned;
    }

    /**
     * @notice Get the size of the envelope expiration queue.
     * @return The size of the envelope expiration queue.
     */
    function envelopeExpirationQueueSize() public view returns (uint256) {
        return envelopeExpirationQueueEnd - envelopeExpirationQueueStart;
    }
}
