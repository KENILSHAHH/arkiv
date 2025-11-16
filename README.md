# <img width="40" height="22" alt="Screenshot 2025-11-16 at 5 50 15 AM" src="https://github.com/user-attachments/assets/5066b4aa-f5a4-4a7d-8cf4-ae877f7cd5c3" />  Arc - Range Markets

**A fully transparent, verifiable on-chain prediction market platform powered by Arkiv Network**

<div align="center">

### 📹 Demo Video

[![Watch Demo Video](https://cdn.loom.com/sessions/thumbnails/73011a0bcd054a1fbddb0e1e7bdbd56e-with-play.gif)](https://www.loom.com/share/73011a0bcd054a1fbddb0e1e7bdbd56e)

*Click to watch the demo video*

### 📊 [View Pitch Deck](https://www.canva.com/design/DAG42Kt0n4g/USkGwQhsFC9otnGSgtZ9PQ/edit?utm_content=DAG42Kt0n4g&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

</div>

---

Built for traders who demand proof, not promises.

---

## 🚨 The Problem with Centralized Prediction Markets

### Current State: Polymarket & Centralized Platforms

Traditional prediction markets like **Polymarket** suffer from fundamental transparency issues:

| Issue | Impact | Why It Matters |
|-------|--------|----------------|
| **🔒 Centralized Database** | All order data stored in private databases | Users must trust the platform's claims about historical prices and orders |
| **❌ No Orderbook Verification** | No way to verify historical orderbook depth | Traders can't prove what bids/asks existed at specific times |
| **🤔 Settlement Opacity** | Market resolution happens off-chain in black boxes | No way to independently verify bet outcomes |
| **📊 Missing Historical Data** | Range market data not publicly accessible | Impossible to audit platform fairness or analyze market manipulation |
| **⏱️ Snapshot Gaps** | Even when data exists, it's sampled at low frequency | Critical price action and orderbook changes go unrecorded |

### Real-World Consequences

1. **Trust-Based Trading**: Traders must blindly trust platforms for:
   - Fair order matching
   - Accurate historical prices
   - Honest settlement decisions
   - Complete orderbook data

2. **No Post-Mortem Analysis**: When disputes arise:
   - No verifiable proof of what orders existed
   - No independent way to verify settlement logic
   - Platform has final say with zero accountability

3. **Market Manipulation Risk**: Without transparent orderbooks:
   - Wash trading can't be detected
   - Spoofing orders leave no trace
   - Front-running is invisible
   - Volume inflation is unverifiable

4. **Legal & Compliance Blind Spots**: 
   - Regulators can't audit historical market data
   - Traders have no evidence for disputes
   - Platforms can selectively disclose data

---

## ✨ Our Solution: Fully On-Chain Transparency

### Every Action, Every Second, Forever Verifiable

**Arkiv Prediction Markets** puts **100% of market data on-chain** at **sub-second intervals**, creating an immutable, auditable record of all market activity.

### What Gets Stored On-Chain

#### 1. **Real-Time Price Feeds** (Sub-second)
```json
{
  "token": "BTC",
  "price": 95593.23,
  "timestamp": 1700000000,
  "pair": "BTC/USD",
  "dataSource": "chainlink-data-streams-realtime"
}
```
- ✅ Every price update (>0.01% change)
- ✅ Sub-second granularity
- ✅ Tamper-proof timestamps
- ✅ Permanently queryable

#### 2. **Complete Orderbook History**
```json
{
  "orderId": "BTC-1700000000-abc123",
  "token": "BTC",
  "side": "bid",          // "up" or "down" bet
  "price": 65,            // cents (65¢ = 65% probability)
  "shares": 100,
  "timestamp": 1700000000,
  "user": "0x1234..."
}
```
- ✅ Every order placement
- ✅ Full order details (price, size, side)
- ✅ User attribution
- ✅ Exact execution timestamps

#### 3. **Market State Snapshots**
```json
{
  "marketId": "BTC-UP-100K-24H",
  "upShares": 1250,
  "downShares": 850,
  "totalVolume": 21000,
  "timestamp": 1700000000
}
```
- ✅ Market depth at any moment
- ✅ Liquidity snapshots
- ✅ Volume tracking
- ✅ AMM state changes

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PREDICTION MARKET FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Price Oracles   │
│  (Polymarket WS) │────────┐
└──────────────────┘        │
                            │ Sub-second Price Updates
┌──────────────────┐        │
│   User Orders    │        │
│  (Buy Up/Down)   │────────┼──────────────────────────────────────┐
└──────────────────┘        │                                      │
                            ↓                                      │
                    ┌───────────────────┐                         │
                    │  Express Server   │                         │
                    │  + WebSocket API  │                         │
                    └─────────┬─────────┘                         │
                              │                                   │
                              │ Store Everything On-Chain         │
                              ↓                                   │
                    ┌─────────────────────────────────┐           │
                    │      ARKIV NETWORK              │           │
                    │  (Decentralized Data Storage)   │           │
                    │                                 │           │
                    │  📊 Price History (1hr TTL)    │           │
                    │  📈 Orderbook Data (24hr TTL)  │           │
                    │  🎯 Market States              │           │
                    └─────────────────┬───────────────┘           │
                                      │                           │
                                      │ Retrievable by Anyone     │
                                      ↓                           │
                    ┌─────────────────────────────────┐           │
                    │   Market Settlement Period      │           │
                    │                                 │           │
                    │  1. Market Expires              │           │
                    │  2. UMA Oracle Proposes Result  │           │
                    │  3. 1-Hour Dispute Period       │           │
                    │  4. Result Finalized            │           │
                    └─────────────────┬───────────────┘           │
                                      │                           │
                              ┌───────┴────────┐                  │
                              ↓                ↓                  │
                    ┌──────────────────┐  ┌──────────────────┐   │
                    │  UMA Optimistic  │  │  Smart Contract  │   │
                    │     Oracle       │  │   Settlement     │   │
                    │                  │  │                  │   │
                    │  ✓ Truth Anchor  │  │  ✓ Auto-payout   │   │
                    │  ✓ Dispute Logic │  │  ✓ Based on UMA  │   │
                    │  ✓ Final Result  │  │  ✓ Provably Fair │   │
                    └──────────────────┘  └──────────────────┘   │
                                                                  │
                    ┌─────────────────────────────────────────────┘
                    │
                    ↓
          ┌──────────────────────────┐
          │   Arkiv Auto-Pruning     │
          │                          │
          │  • Prices: 1hr TTL       │
          │  • Orders: 24hr TTL      │
          │  • Auto-cleanup          │
          │  • Storage optimized     │
          └──────────────────────────┘
```

### Detailed Component Breakdown

#### 1️⃣ **Data Ingestion Layer**

**Real-Time Price Streaming**
- Connects to Polymarket WebSocket API
- Receives Chainlink oracle price updates
- Sub-second latency (<100ms typical)
- Automatic reconnection & error handling
- Supports: BTC, ETH, SOL, and more

**Order Processing**
- REST API for order placement
- AMM-style pricing (market depth-based)
- Instant order confirmation
- WebSocket broadcast to all clients

#### 2️⃣ **On-Chain Storage Layer (Arkiv Network)**

**What Makes Arkiv Special:**
- ✅ **Immutable Storage**: Data can't be altered once written
- ✅ **Public Verification**: Anyone can query and verify data
- ✅ **Time-To-Live (TTL)**: Automatic data expiration to optimize storage
- ✅ **Sub-second Writes**: Fast enough for real-time market data
- ✅ **Queryable by Attributes**: Filter by token, timestamp, order type, etc.

**Storage Strategy:**
```javascript
Price Data (1-hour TTL):
  - Purpose: Real-time price verification
  - Granularity: Sub-second updates
  - Retention: 1 hour (enough for market settlement)
  - Auto-pruning: Yes (via Arkiv TTL)

Order Data (24-hour TTL):
  - Purpose: Orderbook transparency & dispute resolution
  - Granularity: Every order recorded
  - Retention: 24 hours (covers dispute period + analysis)
  - Auto-pruning: Yes (via Arkiv TTL)

Market State (7-day TTL):
  - Purpose: Historical analysis & auditing
  - Granularity: Periodic snapshots
  - Retention: 7 days (for post-market analysis)
  - Auto-pruning: Yes (via Arkiv TTL)
```

#### 3️⃣ **UMA Optimistic Oracle Settlement**

**How Market Resolution Works:**

1. **Market Expiration** (e.g., "Will BTC reach $100K by Dec 31?")
   - Market closes at predetermined time
   - All trading stops
   - Final price oracle reading taken

2. **UMA Oracle Proposal** (Immediate)
   - UMA oracle proposes the correct outcome based on on-chain price data
   - Proposal: "BTC reached $95,593 at expiry → DOWN wins"
   - Proposal bonded with collateral

3. **Dispute Period** (1 Hour)
   - **CRITICAL TRANSPARENCY WINDOW**
   - Anyone can dispute the proposed result
   - Disputers must provide counter-evidence
   - All historical price/orderbook data is available on Arkiv for verification
   - If no disputes → proposal accepted
   - If disputed → UMA's DVM (Data Verification Mechanism) votes

4. **Final Settlement** (After 1 hour)
   - Smart contract automatically settles based on UMA's final result
   - Winners receive payouts
   - Losers' funds distributed
   - All settlement logic is on-chain and verifiable

**Why UMA Optimistic Oracles?**
- ✅ **Economic Security**: Disputers must bond collateral
- ✅ **Community Verification**: Anyone can dispute with proof
- ✅ **Transparent Logic**: All decisions are on-chain
- ✅ **Fraud-Proof**: False proposals get penalized
- ✅ **Battle-Tested**: Used by major DeFi protocols

#### 4️⃣ **Auto-Pruning via Arkiv TTL**

**Automated Data Lifecycle Management:**

```javascript
// Example: Price data with 1-hour TTL
{
  payload: { token: "BTC", price: 95593.23, timestamp: 1700000000 },
  expiresIn: ExpirationTime.fromHours(1),  // Auto-delete after 1 hour
  attributes: [
    { key: "token", value: "BTC" },
    { key: "dataSource", value: "polymarket-realtime" }
  ]
}
```

**Benefits:**
- ✅ **Cost Efficiency**: Don't pay for permanent storage of ephemeral data
- ✅ **Automatic Cleanup**: No manual database maintenance
- ✅ **Retention Policies**: Different TTLs for different data types
- ✅ **Compliance**: Data doesn't live forever (GDPR-friendly)

**TTL Strategy by Data Type:**

| Data Type | TTL | Reasoning |
|-----------|-----|-----------|
| **Real-Time Prices** | 1 hour | Needed only for market settlement + short-term disputes |
| **Orderbook Data** | 24 hours | Covers dispute period + post-trade analysis |
| **Market Results** | 7 days | Historical record for user portfolios |
| **Settlement Proofs** | 30 days | Extended audit trail for regulatory compliance |

---

## 🔐 Trust Comparison

### Centralized Prediction Markets (Polymarket)

```
User → [Black Box Platform] → ??? → Trust Us™
         ↓
    [Private Database]
         ↓
    [Hidden Orderbook]
         ↓
    [Opaque Settlement]
         ↓
      Take Our Word For It
```

**Result**: Users have **zero proof** of fair play.

---

### Arkiv Prediction Markets (Our Platform)

```
User → [Smart Contract] → [Arkiv Network] → Public Data
         ↓                      ↓
    [On-Chain Orders]    [Price History]
         ↓                      ↓
    [UMA Oracle]         [Orderbook Logs]
         ↓                      ↓
      [Verifiable Settlement] 
         ↓
      PROOF > TRUST
```

**Result**: Users can **independently verify** every claim.

---

## 🎯 Key Advantages

### 1. **Post-Trade Verification**
```bash
# Query ANY order from history
curl https://arkiv.network/query \
  -d '{ "token": "BTC", "orderId": "BTC-1700000000-abc123" }'

# Verify orderbook at specific timestamp
curl https://arkiv.network/query \
  -d '{ "token": "BTC", "timestamp": 1700000000 }'
```

**Use Cases:**
- Prove order execution prices
- Analyze market manipulation
- Resolve trading disputes
- Regulatory audits

### 2. **Dispute Resolution with Evidence**
```bash
# Trader claims: "My order wasn't filled at the right price"
# Platform response: "Here's the on-chain proof"

# Query market state when order was placed
arkiv query --token BTC --timestamp 1700000000
# Returns EXACT orderbook depth, best bid/ask, and order queue
```

**Impossible with centralized platforms.**

### 3. **Market Manipulation Detection**
```bash
# Detect wash trading
arkiv query --user 0x1234 --timerange 1700000000-1700003600
# Returns all orders from single user, check for self-trading patterns

# Detect spoofing
arkiv query --token BTC --side bid --cancelled true
# Returns cancelled orders, check for patterns of large orders quickly cancelled
```

**Traditional platforms hide this data.**

### 4. **Regulatory Compliance**
- ✅ Complete audit trail for regulators
- ✅ Timestamps are cryptographically verifiable
- ✅ User activity is traceable (with optional privacy layers)
- ✅ Volume/liquidity claims are provable

### 5. **Academic Research & Market Analysis**
- ✅ Researchers can access full historical data
- ✅ Analyze market efficiency
- ✅ Study prediction market accuracy
- ✅ Build ML models on real, complete data

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (for Express server)
- **Private Key** for Arkiv Network (testnet available)
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/arkiv-prediction-markets.git
cd arkiv-prediction-markets

# 2. Install dependencies
cd express
npm install

# 3. Configure environment
cp .env.example .env
# Add your Arkiv private key to .env:
# PRIVATE_KEY=0xyour_private_key_here

# 4. Start the server
npm start
```

### Server Output

```bash
======================================================================
  Real-time Crypto Price API Server
======================================================================
Server running on http://localhost:3001
API Endpoints:
  GET  /api/price/:token         - Get current price for token
  GET  /api/history/:token       - Get price history for token
  GET  /api/prices               - Get all current prices
  GET  /api/orderbook/:token     - Get orderbook for token
  POST /api/orderbook/:token     - Place new order
  GET  /api/health               - Health check
  WS   /ws                       - WebSocket for real-time updates
======================================================================

✅ Arkiv client initialized: 0xYourAddress
🔴 Connecting to Polymarket WebSocket...
✓ WebSocket connected to Polymarket
✓ Subscribed to crypto prices (BTC, ETH, SOL)

💰 [2:34:56 PM] BTC: $95593.23 (+114.00)
  📦 #1 Arkiv → BTC: $95593.23 → 0xEntityKey123...
💰 [2:34:57 PM] ETH: $3250.45 (+25.00)
  📦 #2 Arkiv → ETH: $3250.45 → 0xEntityKey456...
```

---

## 📊 API Reference

### Price Endpoints

#### Get Current Price
```http
GET /api/price/:token
```

**Example:**
```bash
curl http://localhost:3001/api/price/BTC
```

**Response:**
```json
{
  "token": "BTC",
  "price": 95593.23,
  "timestamp": 1700000000,
  "change": 114.00,
  "previousPrice": 95479.23
}
```

---

#### Get Price History
```http
GET /api/history/:token
```

**Example:**
```bash
curl http://localhost:3001/api/history/BTC
```

**Response:**
```json
{
  "token": "BTC",
  "history": [
    { "price": 95593.23, "timestamp": 1700000000 },
    { "price": 95602.45, "timestamp": 1700000015 },
    { "price": 95610.12, "timestamp": 1700000030 }
  ]
}
```

---

### Orderbook Endpoints

#### Get Orderbook
```http
GET /api/orderbook/:token
```

**Example:**
```bash
curl http://localhost:3001/api/orderbook/BTC
```

**Response:**
```json
{
  "token": "BTC",
  "bids": [
    { "price": 65, "shares": 250, "total": 162.50, "orderCount": 5 },
    { "price": 64, "shares": 180, "total": 115.20, "orderCount": 3 }
  ],
  "asks": [
    { "price": 35, "shares": 200, "total": 70.00, "orderCount": 4 },
    { "price": 36, "shares": 150, "total": 54.00, "orderCount": 2 }
  ],
  "statistics": {
    "totalBidVolume": "430.00",
    "totalAskVolume": "350.00",
    "bestBid": 65,
    "bestAsk": 35,
    "spread": "30.00",
    "totalOrders": 14
  }
}
```

---


**Body:**
```json
{
  "side": "bid",      // "bid" = bet UP, "ask" = bet DOWN
  "shares": 100,
  "user": "0x1234..."  // optional
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/orderbook/BTC \
  -H "Content-Type: application/json" \
  -d '{"side":"bid","shares":100,"user":"0x1234"}'
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderId": "BTC-1700000000-abc123",
    "token": "BTC",
    "side": "bid",
    "price": 65,
    "shares": 100,
    "timestamp": 1700000000,
    "user": "0x1234...",
    "arkivKey": "0xEntityKey789..."
  },
  "arkivKey": "0xEntityKey789...",
  "priceImpact": {
    "oldPrice": 65,
    "newPrice": 67,
    "priceChange": 2
  }
}
```

## 🔍 Verifying Data on Arkiv Network

### Using Arkiv SDK

```javascript
import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';

const client = createPublicClient({
  chain: mendoza,
  transport: http(),
});

// Query price history for BTC
const prices = await client.queryEntities({
  attributes: [
    { key: 'token', value: 'BTC' },
    { key: 'dataSource', value: 'polymarket-realtime' }
  ],
  timeRange: {
    start: Date.now() - 3600000,  // Last hour
    end: Date.now()
  }
});

console.log(`Found ${prices.length} price updates in the last hour`);
prices.forEach(entity => {
  console.log(`  ${entity.timestamp}: $${entity.payload.price}`);
});
```



---

## 🛡️ Security & Trust

### Data Integrity
- ✅ **Cryptographic Hashing**: Every entity has content-addressed key
- ✅ **Timestamp Proofs**: Blockchain-anchored timestamps
- ✅ **Immutable Storage**: Data can't be altered after writing
- ✅ **Public Verification**: Anyone can independently verify

### Privacy Considerations
- Orders are pseudonymous (address-based)
- Optional: Implement zero-knowledge proofs for order privacy
- Price data is fully public (already public via Polymarket)

### Smart Contract Security
- UMA Optimistic Oracle is audited and battle-tested
- Settlement logic is open-source and verifiable
- Multi-sig controls for contract upgrades
- Emergency pause mechanisms

---

## 📈 Use Cases

### 1. **Transparent Prediction Markets**
- Binary outcome markets (yes/no)
- Range markets (price targets)
- Event markets (election results, sports)
- **Key Benefit**: All bets are verifiable

### 2. **Decentralized Sports Betting**
- Real-time odds tracking
- Provably fair payouts
- No platform risk (non-custodial)
- **Key Benefit**: Can't lose funds to platform fraud

### 3. **Financial Derivatives**
- Options-style products
- Perpetual markets
- Volatility trading
- **Key Benefit**: Complete price history for accurate valuation

### 4. **Research & Analytics**
- Market efficiency studies
- Prediction accuracy analysis
- Behavioral economics research
- **Key Benefit**: Access to complete, unfiltered data

---

## 🛠️ Advanced Configuration

### Adjust Price Change Threshold

Only store prices that changed by >0.01%:

```javascript
// In express/server.js
function hasPriceChanged(oldPrice, newPrice) {
  const percentChange = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
  return percentChange > 0.01;  // Adjust this value
}
```

**Lower = More frequent updates (higher storage cost)**  
**Higher = Less frequent updates (lower storage cost)**

---

### Modify TTL Durations

```javascript
// Prices (default: 1 hour)
expiresIn: ExpirationTime.fromHours(1)

// Orders (default: 24 hours)
expiresIn: ExpirationTime.fromHours(24)

// Custom TTLs
expiresIn: ExpirationTime.fromMinutes(30)
expiresIn: ExpirationTime.fromDays(7)
expiresIn: ExpirationTime.fromWeeks(4)
```

---





## 📚 Resources

### Official Documentation
- [Arkiv Network Docs](https://docs.arkiv.network)
- [Arkiv SDK Reference](https://docs.arkiv.network/sdk)
- [UMA Optimistic Oracle](https://docs.umaproject.org)
- [Polymarket API](https://docs.polymarket.com)

### Developer Resources
- [Arkiv Explorer](https://explorer.arkiv.network)
- [UMA Voting Dashboard](https://vote.umaproject.org)
- [Example Smart Contracts](./contracts/)

### Community
- [Discord](https://discord.gg/arkiv)
- [Twitter](https://twitter.com/ArkivNetwork)
- [GitHub Discussions](https://github.com/yourusername/arkiv-prediction-markets/discussions)

---



## 🤝 Contributing

We welcome contributions! Areas of interest:

- **Smart Contract Development**: Help build settlement logic
- **Frontend Development**: Build beautiful UIs for traders
- **Data Analytics**: Create tools for market analysis
- **Documentation**: Improve guides and tutorials
- **Testing**: Help us battle-test the platform

**To contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 🔥 Why This Matters

> "Don't trust. Verify." — Bitcoin Maxim

Traditional prediction markets ask you to **trust** them.  
We give you the tools to **verify** everything.

Every price. Every order. Every settlement. Forever.

**Built with:**
- [Arkiv Network](https://arkiv.network) - Decentralized data storage with TTL
- [UMA Protocol](https://umaproject.org) - Optimistic oracle for trustless settlement
- [Polymarket](https://polymarket.com) - Real-time price feeds
- [Node.js](https://nodejs.org) - High-performance backend
- [WebSocket](https://www.npmjs.com/package/ws) - Real-time communication

---

**Ready to trade with proof, not promises?**

**Start building:** `npm start`  
**Join the movement:** [Discord](https://discord.gg/arkiv)  
**Follow updates:** [Twitter](https://twitter.com/ArkivNetwork)

---

*"In cryptography we trust. In centralized databases, we don't."*
