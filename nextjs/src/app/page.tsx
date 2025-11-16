"use client"
import { useState, useEffect, useMemo } from "react"
import { TrendingUp, Link2, BookmarkIcon, Bitcoin, ChevronDown, RefreshCcw, BarChart2, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCryptoPrice } from "@/hooks/useCryptoPrice"
import { Orderbook } from "./orderbook"

export default function PredictionMarket() {
  const [countdown, setCountdown] = useState({ mins: 2, secs: 57 })
  const [amount, setAmount] = useState(0)
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [activeTime, setActiveTime] = useState("6:30 PM")
  const [selectedSide, setSelectedSide] = useState<'up' | 'down'>('up')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderStatus, setOrderStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showTxModal, setShowTxModal] = useState(false)
  const [txData, setTxData] = useState<{ arkivKey: string, order: any, priceImpact: any } | null>(null)
  const [currentUpPrice, setCurrentUpPrice] = useState(50)
  const [currentDownPrice, setCurrentDownPrice] = useState(50)
  
  // Get real-time Bitcoin price data
  const { currentPrice, priceHistory, isConnected } = useCryptoPrice('BTC')

  // Listen for orderbook updates via WebSocket to update prices
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws')

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.type === 'orderbook_update' && message.token === 'BTC') {
          // Update prices from orderbook updates
          if (message.data.currentUpPrice !== undefined) {
            setCurrentUpPrice(message.data.currentUpPrice)
          }
          if (message.data.currentDownPrice !== undefined) {
            setCurrentDownPrice(message.data.currentDownPrice)
          }
        }
      } catch (error) {
        // Silent fail
      }
    }

    return () => ws.close()
  }, [])
  
  // Fixed price to beat as dummy value
  const priceToBeat = 96098.48

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.secs > 0) {
          return { ...prev, secs: prev.secs - 1 }
        } else if (prev.mins > 0) {
          return { mins: prev.mins - 1, secs: 59 }
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Clear order status after 5 seconds
  useEffect(() => {
    if (orderStatus) {
      const timer = setTimeout(() => setOrderStatus(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [orderStatus])

  // Function to place an order
  const placeOrder = async () => {
    if (amount <= 0) {
      setOrderStatus({ type: 'error', message: 'Amount must be greater than 0' })
      return
    }

    setIsPlacingOrder(true)
    setOrderStatus(null)

    try {
      const orderData = {
        side: selectedSide === 'up' ? 'bid' : 'ask',
        shares: amount,
        user: 'anonymous',
      }

      const response = await fetch('http://localhost:3001/api/orderbook/BTC', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update current prices
        if (selectedSide === 'up') {
          setCurrentUpPrice(result.priceImpact.newPrice)
          setCurrentDownPrice(100 - result.priceImpact.newPrice)
        } else {
          setCurrentDownPrice(result.priceImpact.newPrice)
          setCurrentUpPrice(100 - result.priceImpact.newPrice)
        }

        // Show transaction modal
        setTxData(result)
        setShowTxModal(true)
        
        setOrderStatus({ 
          type: 'success', 
          message: `Order placed! ${amount} ${selectedSide.toUpperCase()} shares @${result.order.price}¢ ✓ Stored on Arkiv` 
        })
        
        // Reset amount after successful order
        setAmount(0)
      } else {
        const error = await response.json()
        setOrderStatus({ type: 'error', message: error.error || 'Failed to place order' })
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setOrderStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const navItems = [
    { icon: TrendingUp, label: "Trending" },
    { label: "Breaking" },
    { label: "New" },
    { label: "Politics" },
    { label: "Sports" },
    { label: "Finance" },
    { label: "Crypto" },
    { label: "Geopolitics" },
    { label: "Earnings" },
    { label: "Tech" },
    { label: "Culture" },
    { label: "World" },
    { label: "Economy" },
    { label: "Elections" },
    { label: "Mentions" },
    { label: "More", icon: ChevronDown },
  ]

  const cryptoList = [
    { name: "Ethereum Up or Down", percentage: "82%", status: "Up", icon: "⟠", color: "bg-[#627EEA]" },
    { name: "Solana Up or Down", percentage: "66%", status: "Up", icon: "◎", color: "bg-gradient-to-br from-[#00FFA3] to-[#DC1FFF]" },
    { name: "XRP Up or Down", percentage: "99%", status: "Up", icon: "✕", color: "bg-[#23292F]", time: "November 15, 6:15PM-6:30PM ET" },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6 overflow-x-auto">
            {navItems.map((item, index) => (
              <button
                key={index}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            ))}
          </div>
          {/* Wallet Balance */}
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Wallet:</span>
            <span className="text-sm font-bold text-gray-900">$100.00</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex">
        {/* Left Section - Chart and Info */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#F7931A] rounded-lg flex items-center justify-center">
                <Bitcoin className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bitcoin Up or Down</h1>
                <p className="text-sm text-gray-500">November 15, 6:15-6:30PM ET</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Link2 className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <BookmarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Price Info */}
          <div className="flex items-end gap-8 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">PRICE TO BEAT</p>
              <p className="text-3xl font-semibold text-gray-600">
                ${priceToBeat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-[#F7931A]">CURRENT PRICE</p>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Live
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Connecting...</span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-[#F7931A]">
                  ${(currentPrice?.price || 95593.23).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className={`text-sm ${(currentPrice?.change || 0) >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded`}>
                  {(currentPrice?.change || 0) >= 0 ? '↑' : '↓'} ${Math.abs(currentPrice?.change || 114).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="text-4xl font-bold text-red-500">{countdown.mins.toString().padStart(2, '0')}</div>
              <div className="text-red-500">
                <div className="text-[10px] leading-tight">MINS</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-4xl font-bold text-red-500">{countdown.secs.toString().padStart(2, '0')}</div>
              <div className="text-red-500">
                <div className="text-[10px] leading-tight">SECS</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="relative h-[400px] mb-8">
            <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F7931A" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#F7931A" stopOpacity="0" />
                </linearGradient>
              </defs>
              {priceHistory.length > 1 && (() => {
                // Calculate min and max for scaling
                const prices = priceHistory.map(p => p.price)
                const minPrice = Math.min(...prices)
                const maxPrice = Math.max(...prices)
                const priceRange = maxPrice - minPrice || 1
                
                // Generate path data
                const pathData = priceHistory.map((point, i) => {
                  const x = (i / (priceHistory.length - 1)) * 1000
                  const y = 400 - ((point.price - minPrice) / priceRange) * 350 - 25
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                }).join(' ')
                
                // Close the path for the gradient fill
                const fillPath = `${pathData} L 1000 400 L 0 400 Z`
                
                return (
                  <>
                    <path
                      d={fillPath}
                      fill="url(#chartGradient)"
                      stroke="none"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#F7931A"
                      strokeWidth="2"
                    />
                  </>
                )
              })()}
            </svg>
            
            {/* Y-axis labels */}
            {priceHistory.length > 0 && (() => {
              const prices = priceHistory.map(p => p.price)
              const minPrice = Math.min(...prices)
              const maxPrice = Math.max(...prices)
              const step = (maxPrice - minPrice) / 3
              
              return (
                <div className="absolute top-0 right-0 flex flex-col justify-between h-full text-xs text-gray-400 pr-2">
                  <div>${maxPrice.toFixed(2)}</div>
                  <div>${(maxPrice - step).toFixed(2)}</div>
                  <div>${(maxPrice - step * 2).toFixed(2)}</div>
                  <div>${minPrice.toFixed(2)}</div>
                </div>
              )
            })()}
          </div>

          {/* Time labels */}
          <div className="flex justify-between text-xs text-gray-400 mb-6 px-4">
            {priceHistory.length > 0 && (() => {
              const numLabels = 7
              const step = Math.max(1, Math.floor(priceHistory.length / (numLabels - 1)))
              const labels = []
              
              for (let i = 0; i < numLabels; i++) {
                const idx = Math.min(i * step, priceHistory.length - 1)
                const timestamp = priceHistory[idx].timestamp
                const time = new Date(timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })
                labels.push(<span key={i}>{time}</span>)
              }
              
              return labels
            })()}
          </div>

          {/* Time Selector */}
          <div className="flex items-center gap-2 mb-8">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <RefreshCcw className="w-4 h-4" />
            </button>
            {["6:30 PM", "6:45 PM", "7 PM", "7:15 PM"].map(time => (
              <Button
                key={time}
                variant={activeTime === time ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTime(time)}
                className={activeTime === time ? "bg-gray-900 text-white" : ""}
              >
                {time}
              </Button>
            ))}
            <Button variant="ghost" size="sm">
              More <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            <button className="p-2 hover:bg-gray-100 rounded-lg ml-auto">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bitcoin className="w-4 h-4 text-[#F7931A]" />
            </button>
          </div>

          {/* Order Book - Live from Arkiv Network */}
          <div className="mb-6">
            <Orderbook token="BTC" />
          </div>

          {/* Market Context */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Market Context</h3>
              <Button variant="link" className="text-blue-600">Generate</Button>
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Trading Panel */}
        <div className="w-[400px] border-l border-gray-200 p-6">
          {/* Buy/Sell Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 py-2 font-medium ${
                activeTab === "buy" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab("sell")}
              className={`flex-1 py-2 font-medium ${
                activeTab === "sell" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
              }`}
            >
              Sell
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 mb-6">
            <span className="text-sm text-gray-600">Market</span>
            <ChevronDown className="w-4 h-4" />
          </div>

          {/* Up/Down Buttons with Live Prices */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
              onClick={() => setSelectedSide('up')}
              className={`h-20 font-semibold flex flex-col items-center justify-center ${
                selectedSide === 'up' 
                  ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
            >
              <div className="text-lg">Up</div>
              <div className="text-2xl font-bold">{currentUpPrice}¢</div>
            </Button>
            <Button 
              onClick={() => setSelectedSide('down')}
              className={`h-20 font-semibold flex flex-col items-center justify-center ${
                selectedSide === 'down' 
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
            >
              <div className="text-lg">Down</div>
              <div className="text-2xl font-bold">{currentDownPrice}¢</div>
            </Button>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Amount</span>
              <span className="text-sm text-gray-500">Balance $100.00</span>
            </div>
            <input
              type="text"
              value={`$${amount}`}
              onChange={(e) => setAmount(Number(e.target.value.replace('$', '')))}
              className="w-full text-5xl font-light text-right border-0 focus:outline-none text-gray-300"
            />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setAmount(amount + 1)}>+$1</Button>
              <Button variant="outline" size="sm" onClick={() => setAmount(amount + 20)}>+$20</Button>
              <Button variant="outline" size="sm" onClick={() => setAmount(amount + 100)}>+$100</Button>
              <Button variant="outline" size="sm" onClick={() => setAmount(100)}>Max</Button>
            </div>
          </div>

          {/* Order Status Message */}
          {orderStatus && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              orderStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {orderStatus.message}
            </div>
          )}

          {/* Buy Button */}
          <Button 
            onClick={placeOrder}
            disabled={isPlacingOrder || amount <= 0}
            className={`w-full h-14 font-semibold text-lg mb-4 ${
              selectedSide === 'up'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPlacingOrder ? (
              <span className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Placing Order...
              </span>
            ) : (
              `Buy ${selectedSide === 'up' ? 'Up' : 'Down'}`
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 mb-2">
            Orders are stored on Arkiv Network
          </p>
          <p className="text-xs text-center text-gray-500 mb-8">
            By trading, you agree to the <span className="underline">Terms of Use</span>.
          </p>

          {/* Other Crypto List */}
          <div className="space-y-3">
            {cryptoList.map((crypto, index) => (
              <Card key={index} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${crypto.color} rounded-lg flex items-center justify-center text-white text-xl font-bold`}>
                      {crypto.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{crypto.name}</div>
                      {crypto.time && (
                        <div className="text-xs text-gray-500">{crypto.time}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{crypto.percentage}</div>
                    <div className="text-xs text-green-600">{crypto.status}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTxModal && txData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTxModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
              <p className="text-gray-600">Your order has been stored on Arkiv Network</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Side:</span>
                <span className={`font-semibold ${txData.order.side === 'bid' ? 'text-green-600' : 'text-red-600'}`}>
                  {txData.order.side === 'bid' ? 'UP' : 'DOWN'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Shares:</span>
                <span className="font-semibold">{txData.order.shares}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Price:</span>
                <span className="font-semibold">{txData.priceImpact.oldPrice}¢</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">New Price:</span>
                <span className="font-semibold">{txData.priceImpact.newPrice}¢</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Price Impact:</span>
                <span className={`font-semibold ${txData.priceImpact.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {txData.priceImpact.priceChange >= 0 ? '+' : ''}{txData.priceImpact.priceChange}¢
                </span>
              </div>
            </div>

            <a
              href={`https://explorer.mendoza.hoodi.arkiv.network/tx/${txData.arkivKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 mb-3"
            >
              View on Arkiv Explorer
              <Link2 className="w-4 h-4" />
            </a>

            <button
              onClick={() => setShowTxModal(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
