# Real-time Crypto Price Feed with Arkiv Integration

This backend server provides real-time cryptocurrency price data from Polymarket, stores it on the Arkiv Network, and streams it to the frontend via WebSocket.

## Features

- ✅ **Real-time Price Tracking**: Connects to Polymarket WebSocket for BTC, ETH, and SOL prices
- ✅ **Arkiv Network Integration**: Automatically uploads price data to Arkiv Network with 1-hour expiration
- ✅ **WebSocket API**: Streams real-time prices to frontend clients
- ✅ **REST API**: Provides HTTP endpoints for price queries
- ✅ **Price History**: Maintains last 100 price points for charting

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Add your Arkiv Network private key:
     ```
     PRIVATE_KEY=your_private_key_here
     ```
   - (Optional) If no private key is set, prices will still stream but won't upload to Arkiv

3. **Start the server:**
   ```bash
   npm run server
   ```

   The server will start on `http://localhost:3001`

## API Endpoints

### REST Endpoints

- `GET /api/prices` - Get all current prices
- `GET /api/price/:token` - Get current price for specific token (BTC, ETH, SOL)
- `GET /api/history/:token` - Get price history for specific token
- `GET /api/health` - Health check and connection status

### WebSocket Endpoint

- `ws://localhost:3001/ws` - Real-time price updates

#### WebSocket Message Format

**Initial Connection:**
```json
{
  "type": "initial_prices",
  "data": {
    "BTC": { "price": 95593.23, "timestamp": 1699999999999, "change": 114 },
    "ETH": { "price": 3250.45, "timestamp": 1699999999999, "change": 25 },
    "SOL": { "price": 245.67, "timestamp": 1699999999999, "change": 12 }
  }
}
```

**Price Updates:**
```json
{
  "type": "price_update",
  "token": "BTC",
  "data": {
    "price": 95593.23,
    "timestamp": 1699999999999,
    "change": 114,
    "previousPrice": 95479.52
  }
}
```

## Architecture

```
Polymarket WebSocket → Backend Server → Arkiv Network
                              ↓
                        WebSocket Server
                              ↓
                     Frontend (Next.js)
```

## Arkiv Network Integration

When a private key is configured, the server automatically:

1. Creates an Arkiv wallet client
2. Queues price updates for sequential upload (prevents nonce conflicts)
3. Uploads data with the following structure:
   - **Payload**: Token, price, timestamp, trading pair
   - **Attributes**: Token, pair, dataSource, priceType, category
   - **Expiration**: 1 hour (auto-pruning)

Upload rate is limited to ~10 transactions/second (100ms delay) to avoid overwhelming the network.

## Logging

The server provides detailed console logging:

- `💰` Real-time price updates from Polymarket
- `📦` Successful uploads to Arkiv Network
- `✅` Connection status and client activity
- `❌` Errors and warnings

## Error Handling

- Automatic WebSocket reconnection with exponential backoff
- Graceful handling of missing private key (continues without Arkiv uploads)
- Queue-based uploads prevent nonce conflicts
- CORS configured for frontend at `http://localhost:3000`

## Development

The server uses ES modules and requires Node.js v16+.

**File**: `server.js` - Main server with all functionality

