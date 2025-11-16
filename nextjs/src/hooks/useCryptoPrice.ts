"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface PriceData {
  price: number
  timestamp: number
  change: number
  previousPrice?: number
}

interface PriceHistory {
  price: number
  timestamp: number
}

interface UseCryptoPriceReturn {
  currentPrice: PriceData | null
  priceHistory: PriceHistory[]
  isConnected: boolean
  error: string | null
}

const API_URL = 'http://localhost:3001'
const WS_URL = 'ws://localhost:3001/ws'

export function useCryptoPrice(token: string = 'BTC'): UseCryptoPriceReturn {
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial price and history
  const fetchInitialData = useCallback(async () => {
    try {
      console.log('📊 Fetching initial data from:', API_URL)
      
      // Fetch current price
      const priceRes = await fetch(`${API_URL}/api/price/${token}`)
      console.log('Price response status:', priceRes.status)
      
      if (priceRes.ok) {
        const priceData = await priceRes.json()
        console.log('✅ Received price data:', priceData)
        setCurrentPrice({
          price: priceData.price,
          timestamp: priceData.timestamp,
          change: priceData.change || 0,
          previousPrice: priceData.previousPrice
        })
      } else {
        console.warn('⚠️ Price API returned:', priceRes.status)
      }

      // Fetch price history
      const historyRes = await fetch(`${API_URL}/api/history/${token}`)
      console.log('History response status:', historyRes.status)
      
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        console.log('✅ Received history data, points:', historyData.history?.length || 0)
        setPriceHistory(historyData.history || [])
      } else {
        console.warn('⚠️ History API returned:', historyRes.status)
      }
    } catch (err) {
      console.error('❌ Error fetching initial data:', err)
      setError('Failed to fetch initial data - Is backend server running on port 3001?')
    }
  }, [token])

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      console.log('Attempting to connect to WebSocket:', WS_URL)
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        setIsConnected(true)
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'initial_prices') {
            // Handle initial prices
            if (message.data[token]) {
              setCurrentPrice(message.data[token])
            }
          } else if (message.type === 'price_update') {
            // Handle price updates
            if (message.token === token) {
              setCurrentPrice(message.data)
              
              // Add to price history
              setPriceHistory(prev => {
                const newHistory = [
                  ...prev,
                  {
                    price: message.data.price,
                    timestamp: message.data.timestamp
                  }
                ]
                // Keep only last 100 points
                return newHistory.slice(-100)
              })
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected', event.code, event.reason)
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...')
          connectWebSocket()
        }, 3000)
      }

      ws.onerror = (err) => {
        console.error('❌ WebSocket error:', err)
        console.error('Backend server running on port 3001?')
        setError('WebSocket connection error - Check if backend is running on port 3001')
        setIsConnected(false)
      }
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError('Failed to create WebSocket connection')
    }
  }, [token])

  // Initialize connection
  useEffect(() => {
    fetchInitialData()
    connectWebSocket()

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [fetchInitialData, connectWebSocket])

  return {
    currentPrice,
    priceHistory,
    isConnected,
    error
  }
}

