// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SubscriptionContract is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    
    struct Tier {
        string name;
        uint256 price; // Price in Wei (or unit of payment token)
        uint256 duration; // Duration in seconds
        bool isActive;
    }

    struct Membership {
        uint256 expiry; // Timestamp when membership expires
        uint256 tierId; // The ID of the tier they are subscribed to
    }

    // State Variables
    Tier[] public tiers;
    mapping(address => Membership) public memberships;
    IERC20 public paymentToken; // Address(0) for native MNT
    address public platformTreasury;
    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%
    
    // Events
    event Subscribed(address indexed subscriber, uint256 tierId, uint256 expiry);
    event Withdrawn(uint256 amount);
    event FeePaid(uint256 amount);
    event TierCreated(uint256 tierId, string name, uint256 price, uint256 duration);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // Initializer pattern for Minimal Proxy Clones
    function initialize(address _owner, address _paymentToken, address _platformTreasury) external initializer {
        __Ownable_init(_owner);
        paymentToken = IERC20(_paymentToken);
        platformTreasury = _platformTreasury;
    }

    // --- Admin Functions ---

    function createTier(string memory _name, uint256 _price, uint256 _duration) external onlyOwner {
        tiers.push(Tier(_name, _price, _duration, true));
        emit TierCreated(tiers.length - 1, _name, _price, _duration);
    }

    function toggleTier(uint256 _tierId) external onlyOwner {
        require(_tierId < tiers.length, "Invalid tier");
        tiers[_tierId].isActive = !tiers[_tierId].isActive;
    }

    function withdraw() external onlyOwner {
        if (address(paymentToken) == address(0)) {
            // Native MNT withdrawal
            uint256 totalBalance = address(this).balance;
            require(totalBalance > 0, "No funds to withdraw");
            
            uint256 fee = 0;
            uint256 ownerAmount = totalBalance;

            // Only calculate fee if treasury is valid
            if (platformTreasury != address(0)) {
                fee = (totalBalance * PLATFORM_FEE_BPS) / 10000;
                ownerAmount = totalBalance - fee;
                
                if (fee > 0) {
                    (bool feeSuccess, ) = payable(platformTreasury).call{value: fee}("");
                    require(feeSuccess, "Fee transfer failed");
                    emit FeePaid(fee);
                }
            }

            (bool success, ) = payable(owner()).call{value: ownerAmount}("");
            require(success, "Withdraw failed");
            emit Withdrawn(ownerAmount);
        } else {
            // ERC20 withdrawal
            uint256 totalBalance = paymentToken.balanceOf(address(this));
            require(totalBalance > 0, "No funds to withdraw");
            
            uint256 fee = 0;
            uint256 ownerAmount = totalBalance;

            // Only calculate fee if treasury is valid
            if (platformTreasury != address(0)) {
                fee = (totalBalance * PLATFORM_FEE_BPS) / 10000;
                ownerAmount = totalBalance - fee;

                if (fee > 0) {
                    paymentToken.safeTransfer(platformTreasury, fee);
                    emit FeePaid(fee);
                }
            }

            paymentToken.safeTransfer(owner(), ownerAmount);
            emit Withdrawn(ownerAmount);
        }
    }

    // --- User Functions ---

    function subscribe(uint256 _tierId) external payable {
        require(_tierId < tiers.length, "Invalid tier");
        Tier memory tier = tiers[_tierId];
        require(tier.isActive, "Tier is not active");

        if (address(paymentToken) == address(0)) {
            require(msg.value >= tier.price, "Insufficient payment");
        } else {
            paymentToken.safeTransferFrom(msg.sender, address(this), tier.price);
        }

        Membership storage membership = memberships[msg.sender];
        
        // If expired or new, start from now. If active, extend.
        if (membership.expiry < block.timestamp) {
            membership.expiry = block.timestamp + tier.duration;
        } else {
            membership.expiry = membership.expiry + tier.duration;
        }
        
        membership.tierId = _tierId;

        emit Subscribed(msg.sender, _tierId, membership.expiry);
    }

    // --- View Functions ---

    function isMember(address _user) external view returns (bool) {
        return memberships[_user].expiry > block.timestamp;
    }

    function getTiers() external view returns (Tier[] memory) {
        return tiers;
    }
}
