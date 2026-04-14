# Backr - Next Gen Membership Platform on Mantle

**Backr** is a decentralized, censorship-resistant membership platform built on the **Mantle Network**. It empowers creators to own their audience, set their own prices, and receive instant payouts without intermediaries.

## 🌟 Features

*   **Decentralized Memberships:** Creators deploy their own smart contracts.
*   **0% Monthly Fees:** Platform takes a flat 5% fee only on successful payments.
*   **Instant Payouts:** Funds settle directly to the creator's wallet.
*   **Tiered Subscriptions:** Customizable membership tiers (Bronze, Silver, Gold, etc.).
*   **Token-Gated Content:** Exclusive posts for subscribers.
*   **Mantle Network:** Fast, cheap, and secure transactions.

## 🛠 Tech Stack

*   **Frontend:** Next.js 15 (App Router), TailwindCSS, Wagmi, RainbowKit
*   **Backend/Database:** Supabase (PostgreSQL)
*   **Smart Contracts:** Solidity (Hardhat)
*   **Blockchain:** Mantle Network (Testnet/Mainnet)

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+
*   npm or yarn
*   MetaMask (configured for Mantle Network)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/CoinTheHat/Patreon-On-Mantle.git
    cd Patreon-On-Mantle
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add the following:

    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_FACTORY_ADDRESS=0x48c87643EE7A20B5741F7d78B09ba23CF246D59F
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📦 Deployment

### Smart Contracts
The contracts are located in the `kinship-contracts` folder (if available separately) or pre-compiled ABIs are in `utils/abis.ts`.
*   **Current Factory Address:** `0x48c87643EE7A20B5741F7d78B09ba23CF246D59F`
*   **Platform Treasury:** `0x7424349843A37Ae97221Fd099d34fF460b04a474`

### Vercel Deployment

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Add the **Environment Variables** listed above in the Vercel dashboard.
4.  Deploy!

## 📜 License

Copyright (c) 2026 Backr (Kinship App). All rights reserved.

This project is proprietary software. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.
