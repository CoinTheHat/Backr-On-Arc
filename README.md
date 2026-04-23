# Backr — Creator Platform on Arc Network

**Backr** is a decentralized, censorship-resistant creator membership platform built for the **Agentic Economy on Arc** — Circle's stablecoin-native L1. Creators own their audience, set their own prices, collect instant USDC payouts, accept nano-payments for micro-content, escrow custom commissions through ERC-8183, and delegate work to on-chain AI agents.

Live: **[backr.digital](https://backr.digital)**

## Features

* **On-chain memberships** — each creator deploys their own `SubscriptionContract` via a shared factory.
* **USDC-native payouts** — native gas + settlement currency on Arc. 95% to creator, 5% platform fee (enforced on-chain).
* **Circle Nanopayments (x402 + Gateway Wallet)** — supporters deposit USDC once, then unlock PPV posts and send nano-tips with gasless EIP-712 signatures that Circle Gateway batches into a single on-chain settlement.
* **ERC-8183 Content Commissions** — supporters request custom content from a creator. Funds lock in escrow; the creator delivers; supporter approves / requests revision / rejects. Trustless for both sides.
* **Agentic AI chat (DeepSeek)** — natural-language agent that can create tiers, deposit to Gateway, send tips, subscribe, unlock PPV, request commissions, withdraw earnings — all on-chain, with a single confirm.
* **Autonomous AI agent** — server-side agent with its own wallet that picks up open commissions, writes deliverables, and submits them on-chain without human input.
* **PPV posts** — paywalled text/image posts unlocked per-post with nano-payments.
* **Role-aware dashboards** — UI auto-detects creator vs. supporter from on-chain contract presence.
* **Live demo runner** — `/demo` executes a scripted flow (deposit → PPV unlocks → tips → AI agent → batched nano-tips) to prove end-to-end on Arc Testnet.

## Tech Stack

* **Frontend** — Next.js 16 (App Router), TailwindCSS, wagmi + viem (injected connector, no wallet aggregator).
* **Smart contracts** — Solidity, deployed to Arc Testnet (chain id `5042002`).
  * `SubscriptionFactory` — `0x6842Adfe50087Ad48bE119124c54cC571a98ba74`
  * `ERC-8183` — `0x0747EEf0706327138c69792bF28Cd525089e4583`
  * USDC (Circle, native gas) — `0x3600000000000000000000000000000000000000`
  * Circle Gateway Wallet — `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`
  * Platform Treasury — `0x7424349843A37Ae97221Fd099d34fF460b04a474`
* **Nanopayments** — `@circle-fin/x402-batching`, `@x402/core`, `@x402/evm`.
* **AI** — DeepSeek (`deepseek-chat`) for both interactive chat and autonomous agent.
* **Database** — PostgreSQL (Railway) for profiles, tiers, posts, PPV purchases, commissions.
* **Deployment** — Railway (Next.js app), Arc Testnet (contracts).

## Hackathon — Agentic Economy on Arc

Built for **lablab.ai × Circle — Agentic Economy on Arc**. Every primitive the track asks for is wired into real user-facing flows:

| Primitive | Where it lives |
|---|---|
| Arc Network | Sole chain — `chain id 5042002`, RPC `rpc.testnet.arc.network` |
| Circle USDC | Native gas + all payments |
| x402 nano-payments | PPV unlock, batched nano-tips, demo runner |
| Circle Gateway Wallet | `/nanopayments` deposit / withdraw, off-chain signed payments |
| ERC-8183 | Content commissions escrow (`/dashboard/jobs`, `/[creator]`) |
| On-chain AI agent | `AIChat` + autonomous job worker (`/api/agent/auto-complete`) |

## Getting Started

```bash
git clone https://github.com/CoinTheHat/Backr-On-Arc.git
cd Backr-On-Arc
npm install
cp .env.example .env.local   # fill in POSTGRES_URL, DEEPSEEK_API_KEY, FEE_PAYER_PRIVATE_KEY
npm run dev
```

Open [localhost:3000](http://localhost:3000), add Arc Testnet to MetaMask, grab testnet USDC, and go.

## License

Copyright (c) 2026 Backr. All rights reserved.
