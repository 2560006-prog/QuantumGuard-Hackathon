// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// QuantumGuard — Farmer Identity Smart Contract
// Network: Ethereum Sepolia Testnet
// Deployed: 0xAf9a6Eefccd63B77D860BD1d544Fa8F661DF1379
// Team: QuantumGuard Hackathon 2026

contract FarmerIdentity {
    address public owner;

    struct Farmer {
        string farmerId;
        string name;
        bytes32 identityHash;
        uint256 registeredAt;
        bool isActive;
        string ipfsDocumentHash; // IPFS CID for documents
    }

    mapping(string => Farmer) private farmers;
    mapping(address => bool) public validators;
    string[] private farmerIds;

    // Events
    event FarmerRegistered(
        string indexed farmerId,
        bytes32 identityHash,
        uint256 timestamp
    );
    event FarmerVerified(
        string indexed farmerId,
        address validator,
        uint256 timestamp
    );
    event DocumentHashUpdated(
        string indexed farmerId,
        string ipfsHash,
        uint256 timestamp
    );
    event ValidatorAdded(address indexed validator);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyValidator() {
        require(
            msg.sender == owner || validators[msg.sender],
            "Only validators can call this"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Register a new farmer on blockchain
    function registerFarmer(
        string memory farmerId,
        string memory name,
        string memory mobile,
        string memory aadhaarLast4
    ) external onlyOwner {
        require(bytes(farmerId).length > 0, "Farmer ID required");
        require(!farmers[farmerId].isActive, "Farmer already registered");

        bytes32 identityHash = keccak256(
            abi.encodePacked(farmerId, name, mobile, aadhaarLast4, block.timestamp)
        );

        farmers[farmerId] = Farmer({
            farmerId: farmerId,
            name: name,
            identityHash: identityHash,
            registeredAt: block.timestamp,
            isActive: true,
            ipfsDocumentHash: ""
        });

        farmerIds.push(farmerId);
        emit FarmerRegistered(farmerId, identityHash, block.timestamp);
    }

    // Update IPFS document hash for farmer
    function updateDocumentHash(
        string memory farmerId,
        string memory ipfsHash
    ) external onlyValidator {
        require(farmers[farmerId].isActive, "Farmer not found");
        farmers[farmerId].ipfsDocumentHash = ipfsHash;
        emit DocumentHashUpdated(farmerId, ipfsHash, block.timestamp);
    }

    // Verify farmer exists on chain
    function verifyFarmer(string memory farmerId)
        external
        view
        returns (
            bool exists,
            bytes32 identityHash,
            uint256 registeredAt,
            string memory ipfsDocumentHash
        )
    {
        Farmer memory f = farmers[farmerId];
        return (f.isActive, f.identityHash, f.registeredAt, f.ipfsDocumentHash);
    }

    // Add validator address
    function addValidator(address validator) external onlyOwner {
        validators[validator] = true;
        emit ValidatorAdded(validator);
    }

    // Get total registered farmers
    function getTotalFarmers() external view returns (uint256) {
        return farmerIds.length;
    }

    // Get farmer ID by index
    function getFarmerIdByIndex(uint256 index)
        external
        view
        returns (string memory)
    {
        require(index < farmerIds.length, "Index out of range");
        return farmerIds[index];
    }

    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}