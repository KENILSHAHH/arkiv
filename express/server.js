/** @format */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { createWalletClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk/utils';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Arkiv client
const privateKey = process.env.PRIVATE_KEY;
let arkivClient = null;

if (privateKey) {
  try {
    const account = privateKeyToAccount(privateKey);
    arkivClient = createWalletClient({
      chain: mendoza,
      transport: http(),
      account: account,
    });
    console.log(`✅ Arkiv client initialized: ${arkivClient.account.address}`);
  } catch (error) {
    console.warn('⚠️  Arkiv client initialization failed:', error.message);
    console.warn('⚠️  Prices will not be uploaded to Arkiv Network');
  }
} else {
  console.warn(
    '⚠️  PRIVATE_KEY not set. Prices will not be uploaded to Arkiv Network'
  );
}

// Enable CORS for Next.js frontend
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

// Store current prices and price history
const currentPrices = {
  BTC: { price: 95593.23, timestamp: Date.now(), change: 114 },
  ETH: { price: 3250.45, timestamp: Date.now(), change: 25 },
  SOL: { price: 245.67, timestamp: Date.now(), change: 12 },
};

// Store price history for charts (last 100 points)
const priceHistory = {
  BTC: [],
  ETH: [],
  SOL: [],
};

// Store orderbook data (bids and asks for prediction market)
const orderbook = {
  BTC: {
    bids: [], // Up shares - people betting price will go UP
    asks: [], // Down shares - people betting price will go DOWN
    upShares: 50, // Total UP shares in market (starts at 50/50)
    downShares: 50, // Total DOWN shares in market
  },
  ETH: {
    bids: [],
    asks: [],
    upShares: 50,
    downShares: 50,
  },
  SOL: {
    bids: [],
    asks: [],
    upShares: 50,
    downShares: 50,
  },
};

/**
 * Calculate price based on market shares (AMM-style)
 * Price = (shares / total) * 100 cents
 * As more people buy UP, UP price increases
 */
function calculatePrice(upShares, downShares, side) {
  const total = upShares + downShares;
  if (side === 'bid') {
    // Buying UP shares - price based on UP ratio
    return Math.round((upShares / total) * 100);
  } else {
    // Buying DOWN shares - price based on DOWN ratio
    return Math.round((downShares / total) * 100);
  }
}

// WebSocket clients for real-time updates
const wsClients = new Set();

// Polymarket WebSocket configuration
const POLYMARKET_WS_HOST = 'wss://ws-live-data.polymarket.com';
const PING_INTERVAL = 5000;

const CRYPTO_SYMBOLS = {
  ethusdt: 'ETH',
  btcusdt: 'BTC',
  solusdt: 'SOL',
};

let polymarketWs = null;
let pingInterval = null;

// Track upload statistics
let uploadCount = 0;
let uploadQueue = [];
let isProcessing = false;

/**
 * Upload price data to Arkiv network
 */
async function uploadPriceToArkiv(priceData, uploadNumber) {
  if (!arkivClient) {
    return null; // Skip if Arkiv client not initialized
  }

  try {
    const payload = {
      payload: jsonToPayload({
        token: priceData.token,
        price: priceData.price,
        timestamp: priceData.timestamp,
        pair: `${priceData.token}/USD`,
      }),
      contentType: 'application/json',
      attributes: [
        { key: 'token', value: priceData.token },
        { key: 'pair', value: `${priceData.token}/USD` },
        { key: 'dataSource', value: 'polymarket-realtime' },
        { key: 'priceType', value: 'realtime' },
        { key: 'category', value: `crypto-${priceData.token.toLowerCase()}` },
      ],
      expiresIn: ExpirationTime.fromHours(1),
    };

    const result = await arkivClient.mutateEntities({
      creates: [payload],
    });

    const entityKey = result.createdEntities[0];
    console.log(
      `  📦 #${uploadNumber} Arkiv → ${
        priceData.token
      }: $${priceData.price.toFixed(2)} → ${entityKey}`
    );

    return entityKey;
  } catch (error) {
    console.error(
      `  ❌ #${uploadNumber} Failed to upload ${priceData.token} to Arkiv:`,
      error.message
    );
    return null;
  }
}

/**
 * Upload order data to Arkiv network
 */
async function uploadOrderToArkiv(orderData) {
  if (!arkivClient) {
    return null; // Skip if Arkiv client not initialized
  }

  try {
    const payload = {
      payload: jsonToPayload({
        orderId: orderData.orderId,
        token: orderData.token,
        side: orderData.side, // 'bid' (up) or 'ask' (down)
        price: orderData.price,
        shares: orderData.shares,
        timestamp: orderData.timestamp,
        user: orderData.user || 'anonymous',
      }),
      contentType: 'application/json',
      attributes: [
        { key: 'token', value: orderData.token },
        { key: 'orderType', value: 'prediction-market' },
        { key: 'side', value: orderData.side },
        { key: 'dataSource', value: 'prediction-market-orderbook' },
        {
          key: 'category',
          value: `orderbook-${orderData.token.toLowerCase()}`,
        },
      ],
      expiresIn: ExpirationTime.fromHours(24), // Orders expire after 24 hours
    };

    const result = await arkivClient.mutateEntities({
      creates: [payload],
    });

    const entityKey = result.createdEntities[0];
    console.log(
      `  📊 Order → ${orderData.token} ${orderData.side.toUpperCase()} ${
        orderData.shares
      } shares @${orderData.price}¢ → ${entityKey}`
    );

    return entityKey;
  } catch (error) {
    console.error(`  ❌ Failed to upload order to Arkiv:`, error.message);
    return null;
  }
}

/**
 * Process the upload queue sequentially
 */
async function processQueue() {
  if (isProcessing || uploadQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (uploadQueue.length > 0) {
    const item = uploadQueue.shift();
    await uploadPriceToArkiv(item.data, item.number);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  isProcessing = false;
}

/**
 * Add price data to queue for Arkiv upload
 */
function queueArkivUpload(priceData) {
  if (!arkivClient) return; // Skip if no Arkiv client

  uploadCount++;
  uploadQueue.push({
    data: priceData,
    number: uploadCount,
  });

  processQueue();
}

/**
 * Process incoming Polymarket crypto price message
 */
function processPriceUpdate(message) {
  try {
    if (message.topic !== 'crypto_prices') {
      return;
    }

    const payload = message.payload;
    const symbol = payload.symbol?.toLowerCase();
    const token = CRYPTO_SYMBOLS[symbol];

    if (!token) {
      return;
    }

    const price = payload.value;
    const timestamp = payload.timestamp || Date.now();

    if (!price || price <= 0) {
      return;
    }

    // Calculate change from previous price
    const previousPrice = currentPrices[token]?.price || price;
    const change = price - previousPrice;

    // Update current price
    currentPrices[token] = {
      price: price,
      timestamp: timestamp,
      change: change,
      previousPrice: previousPrice,
    };

    // Add to price history
    if (!priceHistory[token]) {
      priceHistory[token] = [];
    }

    priceHistory[token].push({
      price: price,
      timestamp: timestamp,
    });

    // Keep only last 100 points
    if (priceHistory[token].length > 100) {
      priceHistory[token].shift();
    }

    // Broadcast to all connected WebSocket clients
    broadcastPriceUpdate(token, currentPrices[token]);

    // Upload to Arkiv Network
    const priceDataForArkiv = {
      token: token,
      price: price,
      timestamp: timestamp,
    };
    queueArkivUpload(priceDataForArkiv);

    console.log(
      `💰 [${new Date(
        timestamp
      ).toLocaleTimeString()}] ${token}: $${price.toFixed(2)} (${
        change >= 0 ? '+' : ''
      }${change.toFixed(2)})`
    );
  } catch (error) {
    console.error('Error processing price update:', error.message);
  }
}

/**
 * Broadcast price update to all WebSocket clients
 */
function broadcastPriceUpdate(token, priceData) {
  const message = JSON.stringify({
    type: 'price_update',
    token: token,
    data: priceData,
  });

  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Broadcast orderbook update to all WebSocket clients
 */
function broadcastOrderbookUpdate(token, orderbookData) {
  const message = JSON.stringify({
    type: 'orderbook_update',
    token: token,
    data: orderbookData,
  });

  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Aggregate orders by price level
 */
function aggregateOrders(orders) {
  const aggregated = {};

  orders.forEach((order) => {
    if (!aggregated[order.price]) {
      aggregated[order.price] = {
        price: order.price,
        shares: 0,
        total: 0,
        orderCount: 0,
      };
    }
    aggregated[order.price].shares += order.shares;
    aggregated[order.price].total += (order.price * order.shares) / 100;
    aggregated[order.price].orderCount += 1;
  });

  return Object.values(aggregated).sort((a, b) => b.price - a.price);
}

/**
 * Connect to Polymarket WebSocket
 */
function connectPolymarketWebSocket() {
  console.log('\n🔴 Connecting to Polymarket WebSocket...');

  polymarketWs = new WebSocket(POLYMARKET_WS_HOST);

  polymarketWs.on('open', () => {
    console.log('✓ WebSocket connected to Polymarket');

    // Subscribe to crypto price feeds
    const subscriptionMessage = {
      action: 'subscribe',
      subscriptions: [
        {
          topic: 'crypto_prices',
          type: '*',
        },
      ],
    };

    polymarketWs.send(JSON.stringify(subscriptionMessage));
    console.log('✓ Subscribed to crypto prices (BTC, ETH, SOL)\n');

    // Start ping interval
    pingInterval = setInterval(() => {
      if (polymarketWs && polymarketWs.readyState === WebSocket.OPEN) {
        polymarketWs.send('ping');
      }
    }, PING_INTERVAL);
  });

  polymarketWs.on('message', (data) => {
    try {
      const dataStr = data.toString();

      if (dataStr === 'pong' || dataStr === 'ping') {
        return;
      }

      if (dataStr.includes('payload')) {
        const message = JSON.parse(dataStr);
        processPriceUpdate(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error.message);
    }
  });

  polymarketWs.on('close', () => {
    console.log('⚠️  Polymarket WebSocket closed. Reconnecting...');
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    setTimeout(connectPolymarketWebSocket, 5000);
  });

  polymarketWs.on('error', (error) => {
    console.error('Polymarket WebSocket error:', error.message);
  });
}

// REST API Endpoints

// Get current price for a token
app.get('/api/price/:token', (req, res) => {
  const token = req.params.token.toUpperCase();

  if (!currentPrices[token]) {
    return res.status(404).json({ error: 'Token not found' });
  }

  res.json({
    token: token,
    ...currentPrices[token],
  });
});

// Get price history for a token
app.get('/api/history/:token', (req, res) => {
  const token = req.params.token.toUpperCase();

  if (!priceHistory[token]) {
    return res.status(404).json({ error: 'Token not found' });
  }

  res.json({
    token: token,
    history: priceHistory[token],
  });
});

// Get all current prices
app.get('/api/prices', (req, res) => {
  res.json(currentPrices);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    polymarketConnected: polymarketWs?.readyState === WebSocket.OPEN,
    activeClients: wsClients.size,
  });
});

// ==================== ORDERBOOK API ENDPOINTS ====================

/**
 * Place a new order (buy up or down shares)
 * POST /api/orderbook/:token
 * Body: { side: 'bid' | 'ask', shares: number, user?: string }
 * Price is calculated dynamically based on market depth (AMM-style)
 */
app.post('/api/orderbook/:token', async (req, res) => {
  const token = req.params.token.toUpperCase();
  const { side, shares, user } = req.body;

  // Validate input
  if (!['bid', 'ask'].includes(side)) {
    return res.status(400).json({ error: 'Side must be "bid" or "ask"' });
  }

  if (!shares || shares <= 0) {
    return res.status(400).json({ error: 'Shares must be greater than 0' });
  }

  if (!orderbook[token]) {
    return res.status(404).json({ error: 'Token not found' });
  }

  // Calculate current price based on market shares
  const currentPrice = calculatePrice(
    orderbook[token].upShares,
    orderbook[token].downShares,
    side
  );

  // Update market shares (buying UP adds to upShares, buying DOWN adds to downShares)
  if (side === 'bid') {
    orderbook[token].upShares += shares;
  } else {
    orderbook[token].downShares += shares;
  }

  // Calculate new price after this purchase
  const newPrice = calculatePrice(
    orderbook[token].upShares,
    orderbook[token].downShares,
    side
  );

  // Create order
  const order = {
    orderId: `${token}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    token: token,
    side: side,
    price: currentPrice, // Price at time of purchase
    shares: parseFloat(shares.toFixed(2)),
    timestamp: Date.now(),
    user: user || 'anonymous',
  };

  // Add to local orderbook
  if (side === 'bid') {
    orderbook[token].bids.push(order);
  } else {
    orderbook[token].asks.push(order);
  }

  // Upload to Arkiv Network
  const arkivKey = await uploadOrderToArkiv(order);
  if (arkivKey) {
    order.arkivKey = arkivKey;
  }

  // Broadcast update to all clients
  const aggregatedBids = aggregateOrders(orderbook[token].bids);
  const aggregatedAsks = aggregateOrders(orderbook[token].asks);

  broadcastOrderbookUpdate(token, {
    bids: aggregatedBids,
    asks: aggregatedAsks,
    currentUpPrice: side === 'bid' ? newPrice : 100 - newPrice,
    currentDownPrice: side === 'ask' ? newPrice : 100 - newPrice,
  });

  res.json({
    success: true,
    order: order,
    arkivKey: arkivKey,
    priceImpact: {
      oldPrice: currentPrice,
      newPrice: newPrice,
      priceChange: newPrice - currentPrice,
    },
  });
});

/**
 * Get orderbook for a token
 * GET /api/orderbook/:token
 */
app.get('/api/orderbook/:token', (req, res) => {
  const token = req.params.token.toUpperCase();

  if (!orderbook[token]) {
    return res.status(404).json({ error: 'Token not found' });
  }

  // Aggregate orders by price level
  const aggregatedBids = aggregateOrders(orderbook[token].bids);
  const aggregatedAsks = aggregateOrders(orderbook[token].asks);

  // Calculate statistics
  const totalBidVolume = orderbook[token].bids.reduce(
    (sum, order) => sum + order.shares,
    0
  );
  const totalAskVolume = orderbook[token].asks.reduce(
    (sum, order) => sum + order.shares,
    0
  );
  const bestBid = aggregatedBids.length > 0 ? aggregatedBids[0].price : null;
  const bestAsk =
    aggregatedAsks.length > 0
      ? aggregatedAsks[aggregatedAsks.length - 1].price
      : null;
  const spread = bestBid && bestAsk ? Math.abs(bestAsk - bestBid) : 0;

  res.json({
    token: token,
    bids: aggregatedBids.slice(0, 10), // Top 10 bid levels
    asks: aggregatedAsks.slice(-10).reverse(), // Top 10 ask levels
    statistics: {
      totalBidVolume: totalBidVolume.toFixed(2),
      totalAskVolume: totalAskVolume.toFixed(2),
      bestBid: bestBid,
      bestAsk: bestAsk,
      spread: spread.toFixed(2),
      totalOrders: orderbook[token].bids.length + orderbook[token].asks.length,
    },
  });
});

/**
 * Get all orders (raw data) for a token
 * GET /api/orderbook/:token/orders
 */
app.get('/api/orderbook/:token/orders', (req, res) => {
  const token = req.params.token.toUpperCase();

  if (!orderbook[token]) {
    return res.status(404).json({ error: 'Token not found' });
  }

  res.json({
    token: token,
    bids: orderbook[token].bids,
    asks: orderbook[token].asks,
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('  Real-time Crypto Price API Server');
  console.log('='.repeat(70));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log(`  GET  /api/price/:token         - Get current price for token`);
  console.log(`  GET  /api/history/:token       - Get price history for token`);
  console.log(`  GET  /api/prices               - Get all current prices`);
  console.log(`  GET  /api/orderbook/:token     - Get orderbook for token`);
  console.log(`  POST /api/orderbook/:token     - Place new order`);
  console.log(`  GET  /api/health               - Health check`);
  console.log(
    `  WS   /ws                       - WebSocket for real-time updates`
  );
  console.log('='.repeat(70));

  // Connect to Polymarket after server starts
  connectPolymarketWebSocket();
});

// WebSocket server for real-time price updates
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  wsClients.add(ws);

  // Send current prices immediately
  ws.send(
    JSON.stringify({
      type: 'initial_prices',
      data: currentPrices,
    })
  );

  // Send current orderbooks for all tokens
  Object.keys(orderbook).forEach((token) => {
    const aggregatedBids = aggregateOrders(orderbook[token].bids);
    const aggregatedAsks = aggregateOrders(orderbook[token].asks);

    ws.send(
      JSON.stringify({
        type: 'orderbook_update',
        token: token,
        data: {
          bids: aggregatedBids,
          asks: aggregatedAsks,
        },
      })
    );
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket client error:', error.message);
    wsClients.delete(ws);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');

  if (pingInterval) {
    clearInterval(pingInterval);
  }

  if (polymarketWs) {
    polymarketWs.close();
  }

  wss.clients.forEach((client) => {
    client.close();
  });

  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});
