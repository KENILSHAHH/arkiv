'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface OrderBookEntry {
  price: number
  shares: number
  total: number
  orderCount?: number
}

interface OrderbookProps {
  token?: string
}

export function Orderbook({ token = 'BTC' }: OrderbookProps) {
  const [bids, setBids] = useState<OrderBookEntry[]>([])
  const [asks, setAsks] = useState<OrderBookEntry[]>([])
  const [volume, setVolume] = useState<number>(0)
  const [spread, setSpread] = useState<number>(0)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch initial orderbook data from backend
  const fetchOrderbook = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/orderbook/${token}`)
      if (response.ok) {
        const data = await response.json()
        setBids(data.bids || [])
        setAsks(data.asks || [])
        
        if (data.statistics) {
          const totalVol = parseFloat(data.statistics.totalBidVolume) + parseFloat(data.statistics.totalAskVolume)
          setVolume(totalVol)
          setSpread(parseFloat(data.statistics.spread))
        }
      }
    } catch (error) {
      console.error('Error fetching orderbook:', error)
    }
  }

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    fetchOrderbook()

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:3001/ws')
        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket connected for orderbook')
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            
            if (message.type === 'orderbook_update' && message.token === token) {
              // Update orderbook with new data from backend
              setBids(message.data.bids || [])
              setAsks(message.data.asks || [])
              
              // Calculate volume
              const totalBidVol = message.data.bids.reduce((sum: number, b: OrderBookEntry) => sum + b.shares, 0)
              const totalAskVol = message.data.asks.reduce((sum: number, a: OrderBookEntry) => sum + a.shares, 0)
              setVolume(totalBidVol + totalAskVol)
              
              // Calculate spread
              if (message.data.bids.length > 0 && message.data.asks.length > 0) {
                const bestBid = message.data.bids[0].price
                const bestAsk = message.data.asks[message.data.asks.length - 1].price
                setSpread(Math.abs(bestAsk - bestBid))
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected - will retry')
          setIsConnected(false)
          // Retry connection after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000)
        }

        ws.onerror = () => {
          // Silent fail - will reconnect automatically
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        setIsConnected(false)
        reconnectTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.close()
      }
    }
  }, [token])

  // Calculate max values for depth visualization
  const maxBidShares = Math.max(...bids.map(b => b.shares), 1)
  const maxAskShares = Math.max(...asks.map(a => a.shares), 1)

  return (
    <Card className="w-full max-w-6xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Order Book</h2>
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">?</span>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
              Live
            </span>
          ) : (
            <span className="text-xs text-gray-400">Connecting...</span>
          )}
        </div>
        <div className="text-muted-foreground">
          {volume > 0 ? `${volume.toFixed(0)} Shares Vol.` : 'No orders yet'}
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Bids Headers */}
        <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground">
          <div className="text-left">TOTAL</div>
          <div className="text-center">SHARES</div>
          <div className="text-right">PRICE</div>
        </div>

        {/* Asks Headers */}
        <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground">
          <div className="text-left">PRICE</div>
          <div className="text-center">SHARES</div>
          <div className="text-right">TOTAL</div>
        </div>
      </div>

      {/* Orderbook Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Bids (left side) */}
        <div className="space-y-1">
          {bids.map((bid, index) => (
            <div
              key={index}
              className="relative grid grid-cols-3 gap-4 py-2 text-sm"
            >
              <div
                className="absolute inset-0 bg-emerald-500/10"
                style={{
                  width: `${(bid.shares / maxBidShares) * 100}%`,
                  marginLeft: 'auto',
                }}
              />
              <div className="relative text-left">${bid.total}</div>
              <div className="relative text-center">{bid.shares}</div>
              <div className="relative text-right font-medium text-emerald-600">
                {bid.price}¢
              </div>
            </div>
          ))}

          {/* Bids Badge */}
          <div className="pt-4">
            <span className="inline-block px-3 py-1 rounded-md bg-emerald-500 text-white text-sm font-medium">
              Bids
            </span>
          </div>
        </div>

        {/* Asks (right side) */}
        <div className="space-y-1">
          {/* Asks Badge */}
          <div className="pb-2">
            <span className="inline-block px-3 py-1 rounded-md bg-red-500 text-white text-sm font-medium">
              Asks
            </span>
          </div>

          {asks.map((ask, index) => (
            <div
              key={index}
              className="relative grid grid-cols-3 gap-4 py-2 text-sm"
            >
              <div
                className="absolute inset-0 bg-red-500/10"
                style={{
                  width: `${(ask.shares / maxAskShares) * 100}%`,
                }}
              />
              <div className="relative text-left font-medium text-red-600">
                {ask.price}¢
              </div>
              <div className="relative text-center">{ask.shares}</div>
              <div className="relative text-right">${ask.total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t text-sm text-muted-foreground">
        <div>
          Best Bid: {bids.length > 0 ? `${bids[0].price}¢` : 'N/A'} | 
          Best Ask: {asks.length > 0 ? `${asks[asks.length - 1].price}¢` : 'N/A'}
        </div>
        <div>Spread: {spread > 0 ? `${spread.toFixed(2)}¢` : 'N/A'}</div>
      </div>

      {/* Empty State */}
      {bids.length === 0 && asks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No orders yet. Be the first to place an order!</p>
          <p className="text-sm mt-2">Orders are stored on Arkiv Network</p>
        </div>
      )}
    </Card>
  )
}
