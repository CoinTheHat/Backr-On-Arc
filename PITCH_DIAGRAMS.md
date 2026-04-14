# Backr - Visual Pitch Schemas

Here are the visual representations of the Backr platform mechanics, business model, and user journey. These diagrams can be included in the "How It Works" and "Business Model" slides.

## 1. The Core Value Loop (Flywheel)
*How the platform grows organically.*

```mermaid
graph TD
    A[Creator Joins] -->|Deploys Contract & Content| B(Exclusive Content)
    B -->|Attracts| C[Fans & Supporters]
    C -->|Pay Subscriptions| D{Smart Contract}
    D -->|Instant Payout| E[Creator Earnings]
    D -->|5% Fee| F[Backr Treasury]
    E -->|Incentivizes| A
    F -->|Funds| G[Platform Development]
    G -->|Better Tools| A
    
    style A fill:#a855f7,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#fff,stroke:#a855f7,stroke-width:2px,color:#000
    style D fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style E fill:#22c55e,stroke:#fff,stroke-width:2px,color:#fff
```

---

## 2. Technical Architecture & Money Flow
*How funds move trustlessly from fan to creator.*

```mermaid
sequenceDiagram
    participant Fan
    participant UI as Web Interface
    participant Factory as Factory Contract
    participant Sub as Subscription Contract
    participant Treasury as Platform Wallet
    participant Creator

    Note over Fan, Creator: Setup Phase
    Creator->>UI: Create Profile & Tiers
    Creator->>Factory: Deploy Subscription Contract
    Factory->>Sub: Create New Instance
    Factory-->>UI: Contract Address Deployed

    Note over Fan, Creator: Subscription Phase
    Fan->>UI: Select Tier & Click 'Subscribe'
    UI->>Sub: Fan Pays (e.g. 10 MNT)
    Sub-->>Sub: Record Subscription & Expiry
    UI-->>Fan: Unlock Exclusive Content

    Note over Fan, Creator: Payout Phase
    Creator->>UI: Click 'Withdraw'
    UI->>Sub: Call Withdraw() Function
    Sub->>Sub: Calculate Fee (5%)
    Sub->>Treasury: Transfer 0.5 MNT (Fee)
    Sub->>Creator: Transfer 9.5 MNT (Earnings)
```

---

## 3. The "Unfair Advantage" Comparison
*Why Backr is superior to Web2 alternatives.*

```mermaid
quadrantChart
    title Decentralization vs. Payout Speed
    x-axis Centralized --> Decentralized
    y-axis Slow Payouts --> Instant Payouts
    quadrant-1 Backr (Ideal)
    quadrant-2 Niche Crypto Tools
    quadrant-3 Patreon / YouTube
    quadrant-4 OnlyFans / Substack
    "Patreon": [0.2, 0.3]
    "Substack": [0.25, 0.35]
    "YouTube": [0.15, 0.25]
    "Backr": [0.9, 0.95]
```

---

## 4. User Journey Map
*From visitor to paid subscriber.*

```mermaid
stateDiagram-v2
    [*] --> Visitor
    Visitor --> ExplorePage: Browses Categories
    ExplorePage --> CreatorProfile: Views Preview
    CreatorProfile --> LockedContent: Sees "Subscribers Only"
    LockedContent --> ConnectWallet: Connects Metamask
    ConnectWallet --> Payment: Signs Transaction
    Payment --> Subscriber: Transaction Confirmed
    Subscriber --> UnlockedContent: Access Granted
    Subscriber --> [*]
```
