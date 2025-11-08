# 🟢 Mandinga  
**Luck as the entry point. Wealth as the outcome.**

A decentralized, onchain saving protocol inspired by Brazilian consórcios. Mandinga transforms the $150B+ consórcio model into a programmable, verifiable, and bankless global coordination system. Built on Arbitrum with Chainlink VRF for provably fair draws and Fhenix for private participant lists.

---

![Mandinga Banner](./images/banner.png)

---

## 🐢 Why Mandinga?

**Saving circles work because of social trust. But trust doesn't appear from nowhere.**

In Brazil, consórcios move more than **$150 billion per year**. The concept is simple: people commit to recurring payments (quotas), and one person is chosen each month to receive the full pot. This repeats until everyone has had their turn. It's one of the most successful financial coordination systems in the world — but it never became global.

**Mandinga makes this model programmable, verifiable, and bankless.**

Traditional systems fail because:
- They require centralized institutions to manage trust
- They're geographically limited
- They lack transparency in winner selection
- They can't operate across borders or currencies

**Blockchain isn't just useful — it's essential.**  
It's the **only infrastructure** that makes savings circles trust-minimized, globally accessible, and cryptographically fair.

---

## 🐍 What It Does


### Current Features (v0.1 — Raffle Bootstrap)

- **✅ Live Dashboard dApp**  
  Real-time view of pot size, quotas sold, countdown to next draw, and your position.

- **✅ Quota-Based Pooling**  
  Users buy quotas with ETH. Your probability of winning is proportional to quotas owned: more quotas = higher chance.

- **✅ Chainlink Verified Draw**  
  We use **Chainlink VRF v2.5** for verifiable randomness and direct on-chain state mutation. The winner is selected cryptographically — no manipulation possible.

- **✅ Winner Claim & Settlement**  
  Every 7 days, the winner can claim the pot. This completes the first rotation and sets the foundation for consortium mechanics.

- **🔒 Private Participant Lists**  
  Participant data is fully private using **Fhenix** encrypted execution. Your financial participation remains confidential.

---

## 🎯 The Roadmap: From Raffle to Consórcio

### Why Start with a Raffle?

A consórcio is essentially **a series of raffles with the same participants plus commitment rules**. Our MVP raffle is not separate — it's the **v0.1 bootloader** of a saving circle.

We begin with a provably fair draw where people buy quotas and Chainlink VRF selects a winner. This creates:
- **Commitment**: Users put skin in the game
- **Participation history**: Reputation and trust building
- **Financial engagement**: An active user base ready for recurring coordination

### v1: Consortium Phase

- **Sequential draws** until all members have won
- **Past winners keep paying** until everyone receives their benefit
- **Mandatory participation** rules enforced by smart contracts
- **No centralized entity** needed — pure code coordination

### v2+: Advanced Features

- **Stylus SBT Ritual Receipts**: On-chain reputation for participation history
- **Orbit-based isolated circles**: Community or geography-specific saving groups
- **Liquid quotas**: Cash out your participation if someone else enters in your place
- **Stylus-based on-chain SVG receipts**: Beautiful, portable proof of participation

---

## 📋 Feature Examples

### ✅ Raffle Entry (v0.1)  
> _Fair, transparent, and accessible to anyone with ETH._

**Maria** wants to save for a down payment but can't access traditional savings vehicles in her country. She joins a Mandinga raffle with $500 and receives 5 quotas.  

The pot reaches $10,000 with 100 total quotas sold. Maria has a **5% chance** of winning this round. When the draw happens, Chainlink VRF selects the winner on-chain — provably random, impossible to manipulate.

If Maria wins, she claims $10,000. If not, she keeps her quotas active for future rounds.

---

### 🔄 Consortium Commitment (v1)  
> _Everyone wins eventually. No one is left behind._

**João** joins a 12-month consortium with 24 members. Each member commits to $500/month. The pot is $12,000 every month.

- **Month 1**: João buys 2 quotas. The VRF selects another member as winner.
- **Month 3**: João wins! He receives $12,000 but must keep paying $500/month.
- **Month 12**: The last member wins. The circle completes. Everyone received $12,000 by paying $6,000 total.

This is **collective liquidity** — turning small recurring payments into large lump sums through programmatic coordination.

---

## ⚙️ How It Works  

### 🔧 Tech Stack

- **Arbitrum Network** — Low-cost, high-throughput EVM chain for accessible participation
- **Chainlink VRF v2.5** — Verifiable randomness for fair winner selection with direct state mutation
- **Fhenix** — Encrypted execution for private participant lists and confidential financial data
- **Hardhat** — Development environment for testing and deployment
- **Solidity** — Core smart contract logic for quotas, draws, and settlements

### 🔐 Key Contracts

- **`ConsortiumCore.sol`** — Main raffle logic, quota management, winner settlement
- **`RandomnessOracle.sol`** — Chainlink VRF integration and callback handling
  - `fulfillRandomWords()` — Receives VRF output and triggers state mutation
  - `ConsortiumCore.fulfillRandomness(uint256)` — Sets winner based on VRF result

> ✅ We use **Chainlink VRF v2.5** to mutate on-chain state directly after randomness fulfillment.  
> 🔒 We use **Fhenix** to keep participant lists fully encrypted on-chain.

---

## 🚧 Roadmap: Work in Progress

We believe in the long-term potential of this protocol. Our vision extends far beyond the current raffle:

- **📜 Consortium Contract**  
  Multi-round draws with mandatory payment enforcement until all members win.

- **🎖️ Stylus SBT Ritual Receipts**  
  On-chain reputation system for participation history and commitment tracking.

- **🌍 Orbit-Based Isolated Circles**  
  Community-specific or geography-specific saving groups using Arbitrum Orbit.

- **🔒 Privacy-Optional Execution**  
  Deeper integration with Zama or Fhenix for fully confidential consortium operations.

- **💧 Liquid Quotas**  
  Secondary market for quotas — exit your position if someone else enters in your place.

- **🎨 On-Chain SVG Receipts**  
  Beautiful, portable, Stylus-based participation proofs as SBTs.

---

## 🏆 Hackathon Bounties

This project qualifies for:

### **Arbitrum**  
Mandinga is **fully deployed on Arbitrum**. Our protocol creates a new on-chain saving primitive that fits DeFi, payments, and financial coordination use cases. We also position ourselves to use **Arbitrum Orbit** later to isolate saving circles per community or geography.

### **Build Guidl / Scaffold-ETH**  
Mandinga is an **approachable dApp for non-traders**. We care about real users saving together, not just developers optimizing yield. Our frontend is simple, emotional, and accessible — fitting Build Guidl's goals: **technical completeness plus UX effectiveness**.

### **Chainlink**  
We use **Chainlink VRF v2.5** inside the contract to mutate on-chain state. This is visible in:
- `RandomnessOracle.sol::fulfillRandomWords()`
- `ConsortiumCore.sol::fulfillRandomness(uint256)` — which sets the winner

### **Fhenix**  
Participant lists in saving circles are **sensitive financial data**. This list of participants is **fully private using Fhenix**. This aligns with Fhenix's encrypted execution goals and ensures users maintain financial privacy.

---

## 🌐 Deployments

* **GitHub Repo**: [mandinga-ethlatam](https://github.com/Milbaxter/mandinga-ethlatam)
* **Live Frontend**: [mandinga.vercel.app](https://mandinga.vercel.app) *(placeholder)*
* **Pitch Deck**: [[View Presentation](https://www.figma.com/slides/TkWbKgdayNwy2gGkU5rN0r/Mandinga?node-id=1-266&t=Mxe2dIlkpDCBihwa-1)] *(placeholder)*
* **Demo Video**: [Watch Demo](https://youtube.link) *(placeholder)*

---

## 🧠 Team

Built by a team passionate about financial inclusion, cryptographic fairness, and onchain coordination:

- **zevictor** 
- **Lu1z.eth** 
- **milbaxter** 

---

## 🛠️ Getting Started

### Prerequisites

```bash
node >= 18.x
npm or yarn
hardhat
```

### Installation

```bash
# Clone the repository
git clone https://github.com/Milbaxter/mandinga-ethlatam
cd mandinga-ethlatam

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Arbitrum RPC, Chainlink VRF subscription, Fhenix keys

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Arbitrum testnet
npx hardhat run scripts/deploy.js --network arbitrum-sepolia
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Documentation

### How to Join a Raffle

1. Connect your wallet (MetaMask, WalletConnect, etc.)
2. View current pot size and countdown
3. Buy quotas with ETH (1 quota = $X)
4. Wait for the draw (automatic via Chainlink VRF)
5. If you win, claim your pot!

### How Quotas Work

- **1 quota = 1 entry** in the raffle
- **Your probability = your quotas / total quotas**
- Example: 5 quotas out of 100 total = 5% chance

### How VRF Selection Works

1. Draw time arrives (e.g., every 7 days)
2. Contract requests randomness from Chainlink VRF
3. VRF returns verifiable random number
4. Contract calculates winner based on random number + quota distribution
5. Winner is set on-chain, immutable and auditable

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Areas We Need Help

- Frontend improvements (React, design system)
- Smart contract optimizations
- Documentation and tutorials
- Community building and outreach
- Translations (especially Portuguese!)

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 💬 Community

- **Discord**: [Join our server](https://discord.link) *(placeholder)*
- **Twitter**: [@mandingaprotocol](https://twitter.link) *(placeholder)*
- **Telegram**: [Mandinga Community](https://t.me/link) *(placeholder)*

---

> _Built during ETHLatam 2025 — for everyone who believes financial coordination should be fair, accessible, and onchain._

---

## 🌱 The Vision

Mandinga is more than a raffle. It's the foundation for a new kind of financial primitive:

**Programmable saving circles that work globally, trustlessly, and transparently.**

In the future, communities will coordinate capital without banks, borders, or intermediaries. Mandinga is the first step toward that world.

**Luck gets you in. Commitment gets everyone out.**
