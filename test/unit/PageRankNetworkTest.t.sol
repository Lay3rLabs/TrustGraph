// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {Attester} from "../../src/contracts/Attester.sol";
import {IndexerResolver} from "../../src/contracts/IndexerResolver.sol";
import {Indexer} from "../../src/contracts/Indexer.sol";
import {SchemaRegistrar} from "../../src/contracts/SchemaRegistrar.sol";
import {EAS} from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";
import {SchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {IEAS} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {ISchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol";
import {ISchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";

// Mock service manager for testing
contract MockWavsServiceManager is IWavsServiceManager {
    function getOperatorWeight(address) external pure returns (uint256) {
        return 100;
    }

    function validate(IWavsServiceHandler.Envelope calldata, IWavsServiceHandler.SignatureData calldata)
        external
        pure
    {
        return;
    }

    function getServiceURI() external pure returns (string memory) {
        return "test-uri";
    }

    function setServiceURI(string calldata) external pure {}

    function getLatestOperatorForSigningKey(address) external pure returns (address) {
        return address(0x1);
    }
}

/// @title PageRankNetworkTest
/// @notice Comprehensive test for creating realistic attestation networks to test PageRank algorithms
/// @dev This test creates various network patterns including hubs, chains, clusters, and bridges
contract PageRankNetworkTest is Test {
    // Contracts
    Attester public attester;
    IndexerResolver public resolver;
    Indexer public indexer;
    EAS public eas;
    SchemaRegistry public schemaRegistry;
    SchemaRegistrar public schemaRegistrar;
    MockWavsServiceManager public serviceManager;

    // Schema IDs
    bytes32 public basicSchemaId;
    bytes32 public likeSchemaId;
    bytes32 public vouchingSchemaId;
    bytes32 public statementSchemaId;

    // Test accounts with names for clarity
    struct TestAccount {
        address addr;
        string name;
        uint256 privateKey;
    }

    TestAccount[] public accounts;

    // Network statistics
    mapping(address => uint256) public outgoingCount;
    mapping(address => uint256) public incomingCount;
    mapping(address => uint256) public totalWeight;

    uint256 public totalAttestations;

    struct Connection {
        uint256 from;
        uint256 to;
        bytes32 schema;
        bytes data;
    }

    function setUp() public {
        console.log("=== Setting up PageRank Test Network ===");

        // Deploy core contracts
        schemaRegistry = new SchemaRegistry();
        eas = new EAS(ISchemaRegistry(address(schemaRegistry)));
        indexer = new Indexer(IEAS(address(eas)));
        resolver = new IndexerResolver(IEAS(address(eas)), indexer);
        schemaRegistrar = new SchemaRegistrar(ISchemaRegistry(address(schemaRegistry)));
        serviceManager = new MockWavsServiceManager();
        attester = new Attester(IEAS(address(eas)), IWavsServiceManager(address(serviceManager)));

        // Register schemas for different types of attestations
        basicSchemaId = schemaRegistrar.register(
            "bytes32 triggerId,string data,uint256 timestamp", ISchemaResolver(address(resolver)), true
        );

        likeSchemaId = schemaRegistrar.register("bool like", ISchemaResolver(address(resolver)), true);

        vouchingSchemaId = schemaRegistrar.register("uint256 weight", ISchemaResolver(address(resolver)), true);

        statementSchemaId = schemaRegistrar.register("string statement", ISchemaResolver(address(resolver)), true);

        // Create test accounts
        _createTestAccounts();

        console.log("Setup complete. Ready to create attestation network.");
    }

    /// @notice Create test accounts with meaningful names for network analysis
    function _createTestAccounts() internal {
        string[15] memory names = [
            "Alice", // 0 - Central hub
            "Bob", // 1 - Influencer
            "Charlie", // 2 - Bridge connector
            "Diana", // 3 - Authority figure
            "Eve", // 4 - Newcomer
            "Frank", // 5 - Community connector
            "Grace", // 6 - Domain specialist
            "Henry", // 7 - Validator
            "Ivy", // 8 - Active participant
            "Jack", // 9 - Cross-linker
            "Kate", // 10 - Cluster member
            "Liam", // 11 - Cluster member
            "Mia", // 12 - Cluster member
            "Noah", // 13 - Witness
            "Olivia" // 14 - Partner
        ];

        for (uint256 i = 0; i < names.length; i++) {
            uint256 privateKey = uint256(keccak256(abi.encodePacked("test_account", i)));
            address addr = vm.addr(privateKey);

            accounts.push(TestAccount({addr: addr, name: names[i], privateKey: privateKey}));

            // Fund accounts for transactions
            vm.deal(addr, 10 ether);

            console.log(string.concat("Created account: ", names[i]), addr);
        }
    }

    /// @notice Test: Create complete PageRank network
    /// @dev This creates a comprehensive network with various patterns for PageRank testing
    function testCreatePageRankNetwork() public {
        console.log("\n=== Creating Comprehensive PageRank Test Network ===");

        // Create different network patterns
        _createHubPattern();
        _createAuthorityPattern();
        _createChainPattern();
        _createMutualConnections();
        _createClusters();
        _createBridgeConnections();
        _createRandomConnections();

        // Log network statistics
        _logNetworkStatistics();

        // Verify network properties
        _verifyNetworkProperties();

        console.log("\n=== PageRank Test Network Creation Complete ===");
        console.log("Total attestations created:", totalAttestations);
        console.log("Network ready for PageRank algorithm testing!");
    }

    /// @notice Create hub-and-spoke pattern with Alice at center
    function _createHubPattern() internal {
        console.log("\nCreating hub pattern with Alice at center...");

        TestAccount memory alice = accounts[0];

        // 8 accounts attest to Alice (making her a hub)
        for (uint256 i = 1; i <= 8; i++) {
            _createAttestation(
                accounts[i],
                alice.addr,
                likeSchemaId,
                abi.encode(true),
                string.concat(accounts[i].name, " endorses hub ", alice.name)
            );
        }

        // Alice attests back to first 4 (bidirectional connections)
        for (uint256 i = 1; i <= 4; i++) {
            _createAttestation(
                alice,
                accounts[i].addr,
                basicSchemaId,
                abi.encode(bytes32("hub_response"), "Hub acknowledgment", block.timestamp),
                string.concat("Hub ", alice.name, " acknowledges ", accounts[i].name)
            );
        }
    }

    /// @notice Create authority pattern with high-weight attestations
    function _createAuthorityPattern() internal {
        console.log("Creating authority pattern with Diana...");

        TestAccount memory diana = accounts[3]; // Diana as authority

        // Diana gives high-weight endorsements to key players
        uint256[6] memory weights = [uint256(95), 90, 85, 80, 75, 70];
        uint256[6] memory recipients = [uint256(0), 1, 2, 5, 6, 7]; // Alice, Bob, Charlie, Frank, Grace, Henry

        for (uint256 i = 0; i < recipients.length; i++) {
            _createAttestation(
                diana,
                accounts[recipients[i]].addr,
                vouchingSchemaId,
                abi.encode(weights[i]),
                string.concat("Authority ", diana.name, " vouches for ", accounts[recipients[i]].name)
            );
        }
    }

    /// @notice Create chain of trust pattern
    function _createChainPattern() internal {
        console.log("Creating chain of trust pattern...");

        // Chain: Bob -> Charlie -> Diana -> Eve -> Frank -> Grace
        uint256[5] memory chain = [uint256(1), 2, 3, 4, 5];
        uint256[5] memory weights = [uint256(80), 75, 70, 65, 60];

        for (uint256 i = 0; i < chain.length - 1; i++) {
            _createAttestation(
                accounts[chain[i]],
                accounts[chain[i + 1]].addr,
                vouchingSchemaId,
                abi.encode(weights[i]),
                string.concat("Chain: ", accounts[chain[i]].name, " -> ", accounts[chain[i + 1]].name)
            );
        }
    }

    /// @notice Create mutual/bidirectional connections
    function _createMutualConnections() internal {
        console.log("Creating mutual connections...");

        // Grace <-> Henry mutual vouching
        _createAttestation(accounts[6], accounts[7].addr, vouchingSchemaId, abi.encode(75), "Grace vouches for Henry");
        _createAttestation(accounts[7], accounts[6].addr, vouchingSchemaId, abi.encode(80), "Henry vouches for Grace");

        // Ivy <-> Jack mutual likes
        _createAttestation(accounts[8], accounts[9].addr, likeSchemaId, abi.encode(true), "Ivy likes Jack");
        _createAttestation(accounts[9], accounts[8].addr, likeSchemaId, abi.encode(true), "Jack likes Ivy");
    }

    /// @notice Create community clusters
    function _createClusters() internal {
        console.log("Creating community clusters...");

        // Cluster 1: Kate, Liam, Mia (tightly connected group)
        uint256[3] memory cluster1 = [uint256(10), 11, 12];
        for (uint256 i = 0; i < cluster1.length; i++) {
            for (uint256 j = i + 1; j < cluster1.length; j++) {
                _createAttestation(
                    accounts[cluster1[i]],
                    accounts[cluster1[j]].addr,
                    likeSchemaId,
                    abi.encode(true),
                    string.concat("Cluster1: ", accounts[cluster1[i]].name, " <-> ", accounts[cluster1[j]].name)
                );
                _createAttestation(
                    accounts[cluster1[j]],
                    accounts[cluster1[i]].addr,
                    likeSchemaId,
                    abi.encode(true),
                    string.concat("Cluster1: ", accounts[cluster1[j]].name, " <-> ", accounts[cluster1[i]].name)
                );
            }
        }

        // Cluster 2: Noah <-> Olivia partnership
        _createAttestation(
            accounts[13], accounts[14].addr, vouchingSchemaId, abi.encode(85), "Noah partners with Olivia"
        );
        _createAttestation(
            accounts[14], accounts[13].addr, vouchingSchemaId, abi.encode(85), "Olivia partners with Noah"
        );
    }

    /// @notice Create bridge connections through Charlie
    function _createBridgeConnections() internal {
        console.log("Creating bridge connections through Charlie...");

        TestAccount memory charlie = accounts[2]; // Charlie as bridge

        // Charlie connects to different clusters/groups
        uint256[6] memory bridges = [uint256(0), 5, 8, 10, 13, 14]; // Alice, Frank, Ivy, Kate, Noah, Olivia

        for (uint256 i = 0; i < bridges.length; i++) {
            _createAttestation(
                charlie,
                accounts[bridges[i]].addr,
                basicSchemaId,
                abi.encode(bytes32("bridge"), "Inter-group connection", block.timestamp),
                string.concat("Bridge ", charlie.name, " connects to ", accounts[bridges[i]].name)
            );
        }
    }

    /// @notice Create random connections for network realism
    function _createRandomConnections() internal {
        console.log("Adding random connections for network diversity...");

        // Strategic random connections to add network complexity
        Connection[8] memory connections = [
            Connection(4, 10, likeSchemaId, abi.encode(true)), // Eve -> Kate
            Connection(5, 13, vouchingSchemaId, abi.encode(60)), // Frank -> Noah
            Connection(7, 11, vouchingSchemaId, abi.encode(65)), // Henry -> Liam
            Connection(9, 14, likeSchemaId, abi.encode(true)), // Jack -> Olivia
            Connection(11, 1, likeSchemaId, abi.encode(true)), // Liam -> Bob
            Connection(12, 6, vouchingSchemaId, abi.encode(55)), // Mia -> Grace
            Connection(14, 4, likeSchemaId, abi.encode(true)), // Olivia -> Eve
            Connection(8, 0, vouchingSchemaId, abi.encode(70)) // Ivy -> Alice
        ];

        for (uint256 i = 0; i < connections.length; i++) {
            Connection memory conn = connections[i];
            _createAttestation(
                accounts[conn.from],
                accounts[conn.to].addr,
                conn.schema,
                conn.data,
                string.concat("Random: ", accounts[conn.from].name, " -> ", accounts[conn.to].name)
            );
        }
    }

    /// @notice Helper to create attestation and track statistics
    function _createAttestation(
        TestAccount memory attester_account,
        address recipient,
        bytes32 schema,
        bytes memory data,
        string memory description
    ) internal {
        vm.prank(attester_account.addr);
        bytes32 uid = attester.attest(schema, recipient, data);

        // Track statistics
        outgoingCount[attester_account.addr]++;
        incomingCount[recipient]++;
        totalAttestations++;

        // Track weight if it's a vouching attestation
        if (schema == vouchingSchemaId) {
            uint256 weight = abi.decode(data, (uint256));
            totalWeight[attester_account.addr] += weight;
        }

        console.log(string.concat("[OK] ", description));
        console.log(string.concat("  UID: ", vm.toString(uid)));

        // Verify attestation was created
        assertTrue(uid != bytes32(0), "Attestation should be created");
    }

    /// @notice Log comprehensive network statistics
    function _logNetworkStatistics() internal view {
        console.log("\n=== Network Statistics ===");

        for (uint256 i = 0; i < accounts.length; i++) {
            TestAccount memory account = accounts[i];
            console.log(
                string.concat(
                    account.name,
                    " (",
                    vm.toString(account.addr),
                    "): ",
                    "Out=",
                    vm.toString(outgoingCount[account.addr]),
                    ", In=",
                    vm.toString(incomingCount[account.addr]),
                    ", Weight=",
                    vm.toString(totalWeight[account.addr])
                )
            );
        }
    }

    /// @notice Verify network has expected properties for PageRank testing
    function _verifyNetworkProperties() internal view {
        console.log("\n=== Network Verification ===");

        // Verify Alice (hub) has highest incoming connections
        assertTrue(incomingCount[accounts[0].addr] >= 8, "Alice should have many incoming");

        // Verify Diana (authority) has high outgoing weight
        assertTrue(totalWeight[accounts[3].addr] >= 400, "Diana should have high total weight");

        // Verify Charlie (bridge) has diverse connections
        assertTrue(outgoingCount[accounts[2].addr] >= 6, "Charlie should have many outgoing");

        // Verify cluster members have mutual connections
        assertTrue(incomingCount[accounts[10].addr] >= 2, "Kate should have cluster connections");
        assertTrue(incomingCount[accounts[11].addr] >= 2, "Liam should have cluster connections");

        // Verify total network size
        assertTrue(totalAttestations >= 40, "Network should have substantial attestations");

        console.log("[OK] All network properties verified");
    }

    /// @notice Test helper to get account by name (for debugging)
    function getAccountByName(string memory name) public view returns (TestAccount memory) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (keccak256(abi.encodePacked(accounts[i].name)) == keccak256(abi.encodePacked(name))) {
                return accounts[i];
            }
        }
        revert("Account not found");
    }

    /// @notice Test: Verify specific network patterns
    function testNetworkPatterns() public {
        testCreatePageRankNetwork(); // First create the network

        console.log("\n=== Testing Specific Network Patterns ===");

        // Test hub pattern
        TestAccount memory alice = accounts[0];
        assertTrue(incomingCount[alice.addr] >= 8, "Alice should be a hub");

        // Test authority pattern
        TestAccount memory diana = accounts[3];
        assertTrue(totalWeight[diana.addr] >= 400, "Diana should have authority weight");

        // Test bridge pattern
        TestAccount memory charlie = accounts[2];
        assertTrue(outgoingCount[charlie.addr] >= 6, "Charlie should be a bridge");

        console.log("[OK] All network patterns verified");
    }

    /// @notice Output PageRank analysis suggestions
    function testPageRankAnalysis() public {
        testCreatePageRankNetwork(); // Create network first

        console.log("\n=== PageRank Analysis Suggestions ===");
        console.log("Expected PageRank leaders based on network structure:");
        console.log("1. Alice - Hub with 9+ incoming connections");
        console.log("2. Diana - Authority with 500+ total vouching weight");
        console.log("3. Charlie - Bridge connecting 6+ different groups");
        console.log("4. Bob - Influencer in chain + hub bidirectional");
        console.log("5. Grace/Henry - Mutual high-weight vouching pair");

        console.log("\nNetwork characteristics favorable for PageRank:");
        console.log("- Multiple hub nodes with high indegree");
        console.log("- Weighted edges (vouching schema)");
        console.log("- Bidirectional relationships");
        console.log("- Clustered communities");
        console.log("- Bridge nodes connecting clusters");
        console.log("- Authority nodes with high-weight outgoing edges");

        console.log("\nRecommended PageRank parameters:");
        console.log("- Damping factor: 0.85 (standard)");
        console.log("- Max iterations: 100");
        console.log("- Convergence threshold: 0.0001");
        console.log("- Consider edge weights from vouching schema");
    }
}
