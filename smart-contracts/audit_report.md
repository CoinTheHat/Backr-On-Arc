# Backr Smart Contract Security Audit

**Date:** 2026-01-14
**Auditor:** Antigravity (AI Auditor)
**Target:** Backr Protocol (Mantle Sepolia)
**Files Audited:**
- `contracts/SubscriptionFactory.sol`
- `contracts/SubscriptionContract.sol`

---

## 1. Architecture & Trust Model

### Architecture
The protocol uses a **Clones (minimal proxy)** pattern:
- **Factory (`SubscriptionFactory`)**: Deploys lightweight clones of a master `SubscriptionContract`.
- **Implementation (`SubscriptionContract`)**: Holds the logic for tiers, memberships, and withdrawals.
- **Treasury**: A simple address receiving platform fees.

### Trust Model
- **Platform (Factory Owner)**:
  - Sets the `platformTreasury` address and `implementation` logic *once* at factory deployment.
  - **Limitation**: The factory is immutable; specialized roles (like Fee Manager) are missing.
- **Creator (Clone Owner)**:
  - Owns their specific `SubscriptionContract`.
  - Can creation/toggle tiers and withdraw funds.
  - **Trust Assumption**: Users trust the Creator not to rug (though funds are sent immediately, withdrawals are manual).
- **Users**: Pay to subscribe. Trust the contract to honor `isMember` status.

---

## 2. Critical & High Findings

### [H-01] Incompatibility with non-standard ERC20s (e.g., USDT)
**Severity: High**
**Location:** `SubscriptionContract.sol` (Functions: `subscribe`, `withdraw`)

**Description:**
The contract uses `IERC20(token).transfer` and `transferFrom`.
- Some tokens (like USDT) do **not** return a boolean value on success; they return nothing (void).
- The `IERC20` interface expects a `bool` return.
- Calling `transfer` on USDT will cause the transaction to **revert** because Solidity cannot decode the missing return value.

**Impact:**
- If a creator calls `createProfile` with USDT as the payment token, **no one can subscribe** and **no one can withdraw**. The contract becomes unusable for USDT.

**Recommendation:**
Use OpenZeppelin's `SafeERC20` library for all token transfers.

```diff
+ import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SubscriptionContract ... {
+   using SafeERC20 for IERC20;
    ...
    function subscribe(...) ... {
-       require(paymentToken.transferFrom(msg.sender, address(this), tier.price), "Payment failed");
+       paymentToken.safeTransferFrom(msg.sender, address(this), tier.price);
    }

    function withdraw() ... {
        ...
-       paymentToken.transfer(platformTreasury, fee);
+       paymentToken.safeTransfer(platformTreasury, fee);
        ...
-       paymentToken.transfer(owner(), ownerAmount);
+       paymentToken.safeTransfer(owner(), ownerAmount);
    }
}
```

---

## 3. Medium Findings

### [M-01] Fees Locked if Treasury is Zero Address
**Severity: Medium**
**Location:** `SubscriptionContract.withdraw`

**Description:**
The logic calculates `fee` and `ownerAmount` (`total - fee`).
If `platformTreasury` is set to `address(0)` (e.g., intentionally or by mistake during initialization):
1. The fee transfer is skipped: `if (fee > 0 && platformTreasury != address(0)) ...`
2. However, `ownerAmount` is still `total - fee`.
3. The `fee` amount is **left remaining** in the contract balance.

In subsequent withdrawals, this specific dust will be "taxed" again (5% of it) and the remainder left stuck again. This creates a permanent leak where 5% of funds are un-withdrawable if the treasury is invalid.

**Recommendation:**
If the treasury is `address(0)`, correct the logic to either:
- Send the full amount to the creator (disable fees).
- OR ensure `platformTreasury` can never be `address(0)` in `initialize`.

```solidity
// Fix: If no treasury, give fee to owner
if (platformTreasury == address(0)) {
    ownerAmount = totalBalance;
    fee = 0;
}
```

### [M-02] Unchecked Return Values on ERC20 Transfers
**Severity: Medium**
**Location:** `SubscriptionContract.withdraw`

**Description:**
In `withdraw()` (ERC20 branch), the code calls:
`paymentToken.transfer(platformTreasury, fee);`
`paymentToken.transfer(owner(), ownerAmount);`

It does **not** check the return value. While standard ERC20s revert on failure, some older tokens return `false`. A silent failure here would mean the event `FeePaid` or `Withdrawn` is emitted, state is considered "handled", but tokens didn't move. Since `withdraw` drains the whole balance without internal accounting, the risk is lower (tokens just stay there), but it breaks the assumption that "withdraw succeeded".

**Recommendation:**
Use `SafeERC20` (as recommended in H-01), which handles these checks automatically.

---

## 4. Low & Informational Findings

### [L-01] Immutable Factory Settings (Treasury)
**Location:** `SubscriptionFactory.sol`

**Description:**
`platformTreasury` is set in the `constructor` and has no update function.
- If the platform needs to rotate its treasury wallet, it must deploy a **new Factory**.
- Existing clones will continue sending fees to the **old** treasury forever (as they store the address in their own storage during `initialize` and have no update function).

**Recommendation:**
- Add `setTreasury(address newTreasury)` to `SubscriptionFactory` (requires `Ownable`).
- Ideally, add `setTreasury` to `SubscriptionContract` (with `onlyPlatform` modifier) to allow migrating old contracts, though this complicates the trust model.

### [L-02] Hardcoded Fees
**Location:** `SubscriptionContract.sol`

**Description:**
`PLATFORM_FEE_BPS` is a `constant` (500 = 5%).
- Fees cannot be adjusted (lowered or raised) without deploying a new implementation and factory.
- This provides rigid guarantees to creators (good) but zero flexibility for the protocol (bad).

**Recommendation:**
Consider making `platformFee` a storage variable set during `initialize`, or fetchable from the Factory.

### [I-01] Implementation Contract Initialization
**Location:** `SubscriptionContract.sol`

**Description:**
The master implementation contract is deployed by the factory but likely never `initialized`.
- A hacker could call `initialize` on the *master copy* to claim ownership.
- Since the contract has no `selfdestruct` or `delegatecall`, the risk is minimal, but it is best practice to prevent this.

**Recommendation:**
Add a constructor to the implementation to lock it:
```solidity
/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}
```

---

## 5. Best Practice Recommendations

1.  **Reentrancy Guard**: While the current logic follows checks-effects-interactions mostly, adding `ReentrancyGuard` from OpenZeppelin is cheap insurance, especially if logic grows complex.
2.  **Events**: Add emit for `ToggleTier`.
3.  **Input Validation**: `createProfile` should check `_paymentToken != address(0)` if you want to support native ETH via a specific flag, or explicitly handle the zero-address logic. Currently it allows 0, ensuring native ETH support, which is fine.

## 6. Summary of Tests to Run

Before mainnet deployment, write tests that:
1.  **USDT Test**: Mock a USDT-like token (returns void) and try to subscribe. **Expect fail** with current code. verify fix with `SafeERC20`.
2.  **Zero Treasury Test**: Set treasury to `0x0`, subscribe, withdraw. Verify `fee` amount remains stuck in contract.
3.  **Fee Calculation**: Verify 5% is exact. Check rounding for very small amounts (wei).

---

**Audit Result:** 
The contracts are simple and generally well-structured but **High Risk** for production due to **ERC20 incompatibility** (H-01). This must be fixed before supporting stablecoins like USDT. The fee logic for zero-address treasury (M-01) should also be patched.
