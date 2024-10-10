'use client'
import { useState } from 'react'
import { ArrowRight, Plus, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { CryptoPrices } from '@/lib/fetchCryptoPrices'
import usePreventScrollOnNumberInput from '@/hooks/usePreventScrollOnNumberInput'

// Mock data - replace with actual data fetching in a real application
const poolData = {
    name: "Balanced Growth Pool",
    totalValue: 10500,
    tokens: [
        { symbol: "BTC", name: "Bitcoin", userBalance: 0.87, poolBalance: 0.15, value: 4200, price: 28000 },
        { symbol: "ETH", name: "Ethereum", userBalance: 5.2, poolBalance: 2, value: 3100, price: 1550 },
    ]
}
interface DepositMoreTokensProps {
    prices: CryptoPrices;
}
export default function DepositMoreTokens({ prices }: DepositMoreTokensProps) {
    // Call the hook to prevent scrolling on number inputs
    usePreventScrollOnNumberInput();
    console.log(prices)
    const [depositAmounts, setDepositAmounts] = useState<{ [key: string]: number }>(
        Object.fromEntries(poolData.tokens.map(token => [token.symbol, 0]))
    )

    const handleAmountChange = (symbol: string, amount: number, balance: number) => {
        if (amount >= 0 && amount <= balance) {
            const newDepositAmounts = { ...depositAmounts, [symbol]: Math.max(0, amount) }
            setDepositAmounts(newDepositAmounts)
        }
    }

    const handlePercentageChange = (symbol: string, percentage: number, balance: number) => {
        if (percentage <= 100) {
            const token = poolData.tokens.find(t => t.symbol === symbol)
            if (token) {
                const amount = (percentage / 100) * token.userBalance
                handleAmountChange(symbol, parseFloat(amount.toFixed(8)), balance)
            }
        }
    }

    const calculateTotalDepositValue = () => {
        return poolData.tokens.reduce((total, token) => {
            return total + (depositAmounts[token.symbol] * token.price)
        }, 0)
    }
    const calculateTotalPoolValue = () => {
        const depositedValue = poolData.tokens.reduce((total, token) => {
            return total + (depositAmounts[token.symbol] * token.price)
        }, 0)
        return depositedValue + poolData.totalValue
    }

    const handleDeposit = () => {
        console.log("Depositing:", depositAmounts)
        // Implement deposit logic here
    }

    return (
        <div className="container min-h-screen p-4 md:p-8">
            <div className=" mx-auto space-y-8">
                <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                        <CardTitle className="text-2xl">Deposit More Tokens</CardTitle>
                        <CardDescription className="text-gray-200">
                            Add funds to your {poolData.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row items-start md:item-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-muted-foreground">Current Pool Value:</h3>
                                <p className="text-3xl font-bold">${poolData.totalValue.toLocaleString()}</p>
                            </div>
                            <div className='my-4 md:my-auto'>
                                <p className="text-lg font-semibold text-muted-foreground">Deposit Value:</p>
                                <p className="text-3xl font-bold">${calculateTotalDepositValue().toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className='grid gap-8 md:grid-cols-1 lg:grid-cols-2'>
                                {poolData.tokens.map((token) => (
                                    <Card key={token.symbol} className="bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xl flex flex-col md:flex-row justify-between items-start md:items-center">
                                                <span>{token.name} ({token.symbol})</span>
                                                <span className="text-sm font-normal text-gray-500">
                                                    ${token.price.toLocaleString()} / {token.symbol}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm">
                                                <span className='text-muted-foreground'>Pool Balance: <span className="text-foreground font-semibold">{token.poolBalance.toLocaleString()} {token.symbol}</span></span>
                                                <span className='text-muted-foreground'>Your Balance: <span className="text-foreground font-semibold">{token.userBalance.toLocaleString()} {token.symbol}</span></span>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground" htmlFor={`${token.symbol}-amount`}>Deposit Amount:</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleAmountChange(token.symbol, depositAmounts[token.symbol] - 0.1, token.userBalance)}
                                                    >
                                                        <Minus className="hover:text-white h-4 w-4" />
                                                    </Button>
                                                    <Input
                                                        id={`${token.symbol}-amount`}
                                                        type="number"
                                                        max={token.userBalance}
                                                        value={depositAmounts[token.symbol] > 0 ? depositAmounts[token.symbol].toFixed(4) : depositAmounts[token.symbol]}
                                                        onChange={(e) => handleAmountChange(token.symbol, parseFloat(e.target.value) || 0, token.userBalance)}
                                                        className="text-center"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleAmountChange(token.symbol, depositAmounts[token.symbol] + 0.1, token.userBalance)}
                                                    >
                                                        <Plus className="hover:text-white h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <p><span className='text-muted-foreground'>Value:</span> ${(depositAmounts[token.symbol] * token.price).toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-muted-foreground" htmlFor={`${token.symbol}-percentage`}>Percentage of Your Balance:</Label>
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
                                                    onValueChange={([value]) => handlePercentageChange(token.symbol, value, token.userBalance)}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-secondary p-6">
                        <div className="w-full flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">

                            <div className='my-4 md:my-auto'>
                                <p className="text-lg font-semibold pb-3 md:pb-0">Total Pool Value:</p>
                                <p className="text-3xl font-bold">${calculateTotalPoolValue().toLocaleString()}</p>
                            </div>
                            <Button className="bg-accent hover:bg-black text-white w-full sm:w-auto" onClick={handleDeposit}>
                                Deposit Tokens <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
