'use client'
import { useState } from 'react'
import { ArrowRight, Info, Plus, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CryptoPrices } from '@/lib/fetchCryptoPrices'

// Mock data - replace with actual data fetching in a real application
const poolData = {
    name: "Balanced Growth Pool",
    totalValue: 10500,
    tokens: [
        { symbol: "BTC", name: "Bitcoin", userBalance: 0.87, poolBalance: 0.15, value: 4200, price: 28000 },
        { symbol: "ETH", name: "Ethereum", userBalance: 5.2, poolBalance: 2, value: 3100, price: 1550 },
        { symbol: "TRX", name: "Tron", userBalance: 50000, poolBalance: 25000, value: 2125, price: 0.085 },
        { symbol: "USDC", name: "USD Coin", userBalance: 2000, poolBalance: 1075, value: 1075, price: 1 },
    ]
}
interface DepositMoreTokensProps {
    prices: CryptoPrices;
}
export default function DepositMoreTokens({ prices }: DepositMoreTokensProps) {
    console.log(prices)
    const [depositAmounts, setDepositAmounts] = useState<{ [key: string]: number }>(
        Object.fromEntries(poolData.tokens.map(token => [token.symbol, 0]))
    )

    const handleAmountChange = (symbol: string, amount: number) => {
        const newDepositAmounts = { ...depositAmounts, [symbol]: Math.max(0, amount) }
        setDepositAmounts(newDepositAmounts)
    }

    const handlePercentageChange = (symbol: string, percentage: number) => {
        const token = poolData.tokens.find(t => t.symbol === symbol)
        if (token) {
            const amount = (percentage / 100) * token.userBalance
            handleAmountChange(symbol, parseFloat(amount.toFixed(8)))
        }
    }

    const calculateTotalDepositValue = () => {
        return poolData.tokens.reduce((total, token) => {
            return total + (depositAmounts[token.symbol] * token.price)
        }, 0)
    }

    const handleDeposit = () => {
        console.log("Depositing:", depositAmounts)
        // Implement deposit logic here
    }

    return (
        <div className="container min-h-screen p-8">
            <div className=" mx-auto space-y-8">
                <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                        <CardTitle className="text-2xl">Deposit More Tokens</CardTitle>
                        <CardDescription className="text-gray-200">
                            Add funds to your {poolData.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Total Pool Value</h3>
                            <p className="text-3xl font-bold">${poolData.totalValue.toLocaleString()}</p>
                        </div>
                        <div className="space-y-6">
                            <div className='grid gap-8 md:grid-cols-1 lg:grid-cols-2'>
                                {poolData.tokens.map((token) => (
                                    <Card key={token.symbol} className="bg-gray-50">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xl flex justify-between items-center">
                                                <span>{token.name} ({token.symbol})</span>
                                                <span className="text-sm font-normal text-gray-500">
                                                    ${token.price.toLocaleString()} / {token.symbol}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Pool Balance: <span className="font-semibold">{token.poolBalance.toLocaleString()} {token.symbol}</span></span>
                                                <span>Your Balance: <span className="font-semibold">{token.userBalance.toLocaleString()} {token.symbol}</span></span>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`${token.symbol}-amount`}>Deposit Amount:</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleAmountChange(token.symbol, depositAmounts[token.symbol] - 0.1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input
                                                        id={`${token.symbol}-amount`}
                                                        type="number"
                                                        value={depositAmounts[token.symbol]}
                                                        onChange={(e) => handleAmountChange(token.symbol, parseFloat(e.target.value) || 0)}
                                                        className="text-center"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleAmountChange(token.symbol, depositAmounts[token.symbol] + 0.1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-4 w-4 text-gray-400" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Value: ${(depositAmounts[token.symbol] * token.price).toLocaleString()}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor={`${token.symbol}-percentage`}>Percentage of Your Balance:</Label>
                                                    <span className="text-sm font-medium">
                                                        {((depositAmounts[token.symbol] / token.userBalance) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <Slider
                                                    id={`${token.symbol}-percentage`}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    value={[(depositAmounts[token.symbol] / token.userBalance) * 100]}
                                                    onValueChange={([value]) => handlePercentageChange(token.symbol, value)}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 p-6">
                        <div className="w-full flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <div>
                                <p className="text-lg font-semibold">Total Deposit Value:</p>
                                <p className="text-3xl font-bold">${calculateTotalDepositValue().toLocaleString()}</p>
                            </div>
                            <Button className="w-full sm:w-auto" onClick={handleDeposit}>
                                Deposit Tokens <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}