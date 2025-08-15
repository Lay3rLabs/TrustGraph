// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IEAS} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {ISchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {Attester} from "../src/contracts/Attester.sol";
import {SchemaRegistrar} from "../src/contracts/SchemaRegistrar.sol";
import {DeployEAS} from "./DeployEAS.s.sol";
import {Common} from "./Common.s.sol";

/// @title PageRankTest
/// @notice Creates a comprehensive network of attestations to test PageRank algorithms
/// @dev This script generates multiple accounts and creates various attestation patterns
///      to simulate a realistic network for PageRank testing
contract PageRankTest is Common {
    struct TestAccount {
        address addr;
        uint256 privateKey;
        string name;
    }

    struct AttestationPattern {
        address attester;
        address recipient;
        bytes32 schema;
        bytes data;
        string description;
    }

    // Test accounts for creating diverse attestation patterns
    TestAccount[] public testAccounts;

    // Attestation patterns to create
    AttestationPattern[] public patterns;

    /// @notice Run the PageRank test script
    /// @param easAddr EAS contract address
    /// @param attesterAddr Attester contract address
    /// @param basicSchemaId Basic schema ID for attestations
    /// @param likeSchemaId Like schema ID for simple attestations
    /// @param vouchingSchemaId Vouching schema ID for weighted attestations
    /// @param statementSchemaId Statement schema ID for text attestations
    function run(
        address easAddr,
        address attesterAddr,
        bytes32 basicSchemaId,
        bytes32 likeSchemaId,
        bytes32 vouchingSchemaId,
        bytes32 statementSchemaId
    ) public {
        require(easAddr != address(0), "Invalid EAS address");
        require(attesterAddr != address(0), "Invalid Attester address");

        console.log("=== PageRank Test Network Generation ===");
        console.log("EAS Address:", easAddr);
        console.log("Attester Address:", attesterAddr);

        // Initialize contracts
        IEAS eas = IEAS(easAddr);
        Attester attester = Attester(attesterAddr);

        // Create test accounts
        _createTestAccounts();

        // Fund test accounts
        _fundTestAccounts();

        // Create diverse attestation patterns
        _createAttestationPatterns(
            basicSchemaId,
            likeSchemaId,
            vouchingSchemaId,
            statementSchemaId
        );

        // Execute attestations
        _executeAttestations(attester);

        console.log("=== PageRank Test Network Complete ===");
        console.log("Total accounts created:", testAccounts.length);
        console.log("Total attestations created:", patterns.length);

        _logNetworkSummary();
    }

    /// @notice Create test accounts with deterministic private keys
    function _createTestAccounts() internal {
        console.log("Creating test accounts...");

        // Create 15 test accounts for diverse network patterns
        string[15] memory names = [
            "Alice", // Central hub - will receive many attestations
            "Bob", // Influencer - will give and receive attestations
            "Charlie", // Bridge - connects different groups
            "Diana", // Authority - high-weight attestations
            "Eve", // Newcomer - few attestations
            "Frank", // Connector - links to many others
            "Grace", // Specialist - specific domain attestations
            "Henry", // Validator - validates others
            "Ivy", // Community member
            "Jack", // Cross-linker
            "Kate", // Endorser
            "Liam", // Contributor
            "Mia", // Supporter
            "Noah", // Witness
            "Olivia" // Participant
        ];

        for (uint256 i = 0; i < names.length; i++) {
            uint256 privateKey = uint256(
                keccak256(abi.encodePacked("pagerank_test", i))
            );
            address addr = vm.addr(privateKey);

            testAccounts.push(
                TestAccount({
                    addr: addr,
                    privateKey: privateKey,
                    name: names[i]
                })
            );

            console.log(string.concat("Created account ", names[i], ":"), addr);
        }
    }

    /// @notice Fund all test accounts with ETH for transactions
    function _fundTestAccounts() internal {
        console.log("Funding test accounts...");

        for (uint256 i = 0; i < testAccounts.length; i++) {
            vm.deal(testAccounts[i].addr, 10 ether);
            console.log(
                string.concat("Funded ", testAccounts[i].name, " with 10 ETH")
            );
        }
    }

    /// @notice Create diverse attestation patterns for PageRank testing
    function _createAttestationPatterns(
        bytes32 basicSchemaId,
        bytes32 likeSchemaId,
        bytes32 vouchingSchemaId,
        bytes32 statementSchemaId
    ) internal {
        console.log("Creating attestation patterns...");

        // Pattern 1: Hub and Spoke - Alice as central hub
        _createHubPattern(testAccounts[0], basicSchemaId, likeSchemaId);

        // Pattern 2: Chain of Trust - Sequential attestations
        _createChainPattern(basicSchemaId, vouchingSchemaId);

        // Pattern 3: Mutual Attestations - Bidirectional relationships
        _createMutualPattern(likeSchemaId, vouchingSchemaId);

        // Pattern 4: Authority Endorsements - High-weight attestations from Diana
        _createAuthorityPattern(
            testAccounts[3],
            vouchingSchemaId,
            statementSchemaId
        );

        // Pattern 5: Community Clustering - Groups of related attestations
        _createClusterPattern(basicSchemaId, likeSchemaId);

        // Pattern 6: Bridge Connections - Charlie connecting different groups
        _createBridgePattern(testAccounts[2], basicSchemaId, vouchingSchemaId);

        // Pattern 7: Random Connections - Add some noise to the network
        _createRandomPattern(likeSchemaId, basicSchemaId);
    }

    /// @notice Create hub and spoke pattern with Alice at center
    function _createHubPattern(
        TestAccount memory hub,
        bytes32 basicSchemaId,
        bytes32 likeSchemaId
    ) internal {
        console.log("Creating hub pattern with", hub.name);

        // Many accounts attest to Alice (hub)
        for (uint256 i = 1; i <= 8; i++) {
            patterns.push(
                AttestationPattern({
                    attester: testAccounts[i].addr,
                    recipient: hub.addr,
                    schema: likeSchemaId,
                    data: abi.encode(true),
                    description: string.concat(
                        testAccounts[i].name,
                        " likes ",
                        hub.name
                    )
                })
            );
        }

        // Alice attests back to some (creating bidirectional links)
        for (uint256 i = 1; i <= 4; i++) {
            patterns.push(
                AttestationPattern({
                    attester: hub.addr,
                    recipient: testAccounts[i].addr,
                    schema: basicSchemaId,
                    data: abi.encode(
                        bytes32("hub_response"),
                        "Thanks for the support!",
                        block.timestamp
                    ),
                    description: string.concat(
                        hub.name,
                        " responds to ",
                        testAccounts[i].name
                    )
                })
            );
        }
    }

    /// @notice Create chain pattern - A -> B -> C -> D
    function _createChainPattern(
        bytes32 basicSchemaId,
        bytes32 vouchingSchemaId
    ) internal {
        console.log("Creating chain pattern");

        // Create a trust chain: Bob -> Charlie -> Diana -> Eve -> Frank
        for (uint256 i = 1; i <= 4; i++) {
            uint256 weight = 100 - (i * 20); // Decreasing weights down the chain
            patterns.push(
                AttestationPattern({
                    attester: testAccounts[i].addr,
                    recipient: testAccounts[i + 1].addr,
                    schema: vouchingSchemaId,
                    data: abi.encode(weight),
                    description: string.concat(
                        testAccounts[i].name,
                        " vouches for ",
                        testAccounts[i + 1].name,
                        " with weight ",
                        vm.toString(weight)
                    )
                })
            );
        }
    }

    /// @notice Create mutual attestation patterns
    function _createMutualPattern(
        bytes32 likeSchemaId,
        bytes32 vouchingSchemaId
    ) internal {
        console.log("Creating mutual attestation patterns");

        // Grace and Henry mutual attestations
        patterns.push(
            AttestationPattern({
                attester: testAccounts[6].addr, // Grace
                recipient: testAccounts[7].addr, // Henry
                schema: vouchingSchemaId,
                data: abi.encode(80),
                description: "Grace vouches for Henry"
            })
        );

        patterns.push(
            AttestationPattern({
                attester: testAccounts[7].addr, // Henry
                recipient: testAccounts[6].addr, // Grace
                schema: vouchingSchemaId,
                data: abi.encode(75),
                description: "Henry vouches for Grace"
            })
        );

        // Ivy and Jack mutual likes
        patterns.push(
            AttestationPattern({
                attester: testAccounts[8].addr, // Ivy
                recipient: testAccounts[9].addr, // Jack
                schema: likeSchemaId,
                data: abi.encode(true),
                description: "Ivy likes Jack"
            })
        );

        patterns.push(
            AttestationPattern({
                attester: testAccounts[9].addr, // Jack
                recipient: testAccounts[8].addr, // Ivy
                schema: likeSchemaId,
                data: abi.encode(true),
                description: "Jack likes Ivy"
            })
        );
    }

    /// @notice Create authority endorsement pattern with high-weight attestations
    function _createAuthorityPattern(
        TestAccount memory authority,
        bytes32 vouchingSchemaId,
        bytes32 statementSchemaId
    ) internal {
        console.log("Creating authority pattern with", authority.name);

        // Diana (authority) gives high-weight endorsements
        uint256[5] memory highWeights = [uint256(95), 90, 85, 80, 75];
        uint256[5] memory recipients = [uint256(0), 1, 2, 5, 6]; // Alice, Bob, Charlie, Frank, Grace

        for (uint256 i = 0; i < 5; i++) {
            patterns.push(
                AttestationPattern({
                    attester: authority.addr,
                    recipient: testAccounts[recipients[i]].addr,
                    schema: vouchingSchemaId,
                    data: abi.encode(highWeights[i]),
                    description: string.concat(
                        authority.name,
                        " gives high-weight endorsement to ",
                        testAccounts[recipients[i]].name
                    )
                })
            );
        }
    }

    /// @notice Create community cluster patterns
    function _createClusterPattern(
        bytes32 basicSchemaId,
        bytes32 likeSchemaId
    ) internal {
        console.log("Creating community cluster patterns");

        // Cluster 1: Kate, Liam, Mia (accounts 10, 11, 12)
        for (uint256 i = 10; i <= 11; i++) {
            for (uint256 j = i + 1; j <= 12; j++) {
                patterns.push(
                    AttestationPattern({
                        attester: testAccounts[i].addr,
                        recipient: testAccounts[j].addr,
                        schema: likeSchemaId,
                        data: abi.encode(true),
                        description: string.concat(
                            testAccounts[i].name,
                            " supports ",
                            testAccounts[j].name,
                            " in cluster"
                        )
                    })
                );
            }
        }

        // Cluster 2: Noah and Olivia (accounts 13, 14)
        patterns.push(
            AttestationPattern({
                attester: testAccounts[13].addr,
                recipient: testAccounts[14].addr,
                schema: basicSchemaId,
                data: abi.encode(
                    bytes32("cluster2"),
                    "Partnership attestation",
                    block.timestamp
                ),
                description: "Noah attests partnership with Olivia"
            })
        );
    }

    /// @notice Create bridge connections through Charlie
    function _createBridgePattern(
        TestAccount memory bridge,
        bytes32 basicSchemaId,
        bytes32 vouchingSchemaId
    ) internal {
        console.log("Creating bridge pattern with", bridge.name);

        // Charlie connects different clusters/groups
        uint256[6] memory connections = [uint256(0), 5, 8, 10, 13, 14]; // Different groups

        for (uint256 i = 0; i < connections.length; i++) {
            patterns.push(
                AttestationPattern({
                    attester: bridge.addr,
                    recipient: testAccounts[connections[i]].addr,
                    schema: basicSchemaId,
                    data: abi.encode(
                        bytes32("bridge"),
                        "Cross-group connection",
                        block.timestamp
                    ),
                    description: string.concat(
                        bridge.name,
                        " bridges to ",
                        testAccounts[connections[i]].name
                    )
                })
            );
        }
    }

    /// @notice Create random connections for network noise
    function _createRandomPattern(
        bytes32 likeSchemaId,
        bytes32 basicSchemaId
    ) internal {
        console.log("Creating random connection patterns");

        // Add some random connections to make network more realistic
        uint256[8] memory randomPairs = [
            uint256(4),
            10, // Eve -> Kate
            uint256(5),
            13, // Frank -> Noah
            uint256(7),
            11, // Henry -> Liam
            uint256(9),
            14 // Jack -> Olivia
        ];

        for (uint256 i = 0; i < randomPairs.length; i += 2) {
            patterns.push(
                AttestationPattern({
                    attester: testAccounts[randomPairs[i]].addr,
                    recipient: testAccounts[randomPairs[i + 1]].addr,
                    schema: likeSchemaId,
                    data: abi.encode(true),
                    description: string.concat(
                        testAccounts[randomPairs[i]].name,
                        " random connection to ",
                        testAccounts[randomPairs[i + 1]].name
                    )
                })
            );
        }
    }

    /// @notice Execute all attestation patterns
    function _executeAttestations(Attester attester) internal {
        console.log("Executing attestations...");

        for (uint256 i = 0; i < patterns.length; i++) {
            AttestationPattern memory pattern = patterns[i];

            // Find the attester account to use their private key
            uint256 attesterIndex = _findAccountIndex(pattern.attester);
            require(attesterIndex < testAccounts.length, "Attester not found");

            vm.startBroadcast(testAccounts[attesterIndex].privateKey);

            bytes32 uid = attester.attest(
                pattern.schema,
                pattern.recipient,
                pattern.data
            );

            vm.stopBroadcast();

            console.log(
                string.concat(
                    "Attestation ",
                    vm.toString(i + 1),
                    "/",
                    vm.toString(patterns.length),
                    ": ",
                    pattern.description
                )
            );
            console.log("  UID:", vm.toString(uid));
        }
    }

    /// @notice Find account index by address
    function _findAccountIndex(address addr) internal view returns (uint256) {
        for (uint256 i = 0; i < testAccounts.length; i++) {
            if (testAccounts[i].addr == addr) {
                return i;
            }
        }
        revert("Account not found");
    }

    /// @notice Log network summary for analysis
    function _logNetworkSummary() internal view {
        console.log("\n=== Network Analysis Summary ===");

        // Count attestations per account
        for (uint256 i = 0; i < testAccounts.length; i++) {
            uint256 outgoing = 0;
            uint256 incoming = 0;

            for (uint256 j = 0; j < patterns.length; j++) {
                if (patterns[j].attester == testAccounts[i].addr) {
                    outgoing++;
                }
                if (patterns[j].recipient == testAccounts[i].addr) {
                    incoming++;
                }
            }

            console.log(
                string.concat(
                    testAccounts[i].name,
                    " (",
                    vm.toString(testAccounts[i].addr),
                    "): Out=",
                    vm.toString(outgoing),
                    ", In=",
                    vm.toString(incoming)
                )
            );
        }

        console.log("\n=== Expected PageRank Leaders ===");
        console.log("1. Alice (Hub center) - Should have highest PageRank");
        console.log("2. Diana (Authority) - High weights should boost score");
        console.log("3. Charlie (Bridge) - Connects multiple groups");
        console.log(
            "4. Bob (Chain start + bidirectional) - Strong connections"
        );
        console.log("5. Frank (Chain member + authority endorsed)");

        console.log("\n=== Test Complete ===");
        console.log("Network ready for PageRank analysis!");
        console.log(
            "Consider running rewards component to see PageRank calculations."
        );
    }
}
