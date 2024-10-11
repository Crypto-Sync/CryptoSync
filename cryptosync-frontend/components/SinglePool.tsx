'use client'
import { useEffect, useState } from 'react'
import { ArrowUpRight, TrendingUp, TrendingDown, BarChart2, RefreshCcw, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, PlusCircle, Settings, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import * as Progress from "@radix-ui/react-progress"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from 'next/navigation'
import { TronWeb } from "tronweb"
import { abi } from '@/abis/PoolContract.json'
import { formatReadableDateOnly, formatReadableTimeWithTimeZone } from '@/lib/dateFormatter'
// Mock data - replace with actual data fetching in a real application
const poolData = {
    name: "Balanced Growth Pool",
    createdAt: "2023-09-15",
    initialBalance: 10000,
    currentBalance: 10500,
    assets: [
        { name: "Bitcoin", symbol: "BTC", initialAllocation: 40, currentAllocation: 42, initialPrice: 26000, currentPrice: 27000 },
        { name: "Ethereum", symbol: "ETH", initialAllocation: 30, currentAllocation: 28, initialPrice: 1600, currentPrice: 1550 },
        { name: "Tron", symbol: "TRX", initialAllocation: 20, currentAllocation: 21, initialPrice: 0.08, currentPrice: 0.085 },
        { name: "USD Coin", symbol: "USDC", initialAllocation: 10, currentAllocation: 9, initialPrice: 1, currentPrice: 1 },
    ],
    transactions: [
        { id: 1, type: "Rebalance", date: "2023-09-20", description: "Automatic rebalancing triggered due to 5% threshold breach", txHash: "0x123...abc", beforeStatus: { BTC: 43, ETH: 28, TRX: 19, USDC: 10 }, afterStatus: { BTC: 40, ETH: 30, TRX: 20, USDC: 10 }, gasFee: 0.1, duration: "2 minutes" },
        { id: 2, type: "Take Profit", date: "2023-09-22", description: "Take profit executed for BTC at 10% gain", txHash: "0x456...def", beforeStatus: { BTC: 45, ETH: 28, TRX: 18, USDC: 9 }, afterStatus: { BTC: 40, ETH: 30, TRX: 20, USDC: 10 }, gasFee: 0.15, duration: "1 minute", profitAmount: 500 },
        { id: 3, type: "Rebalance", date: "2023-09-25", description: "Automatic rebalancing triggered due to 5% threshold breach", txHash: "0x789...ghi", beforeStatus: { BTC: 42, ETH: 29, TRX: 21, USDC: 8 }, afterStatus: { BTC: 40, ETH: 30, TRX: 20, USDC: 10 }, gasFee: 0.12, duration: "3 minutes" },
        { id: 4, type: "Stop Loss", date: "2023-09-28", description: "Stop loss executed for ETH at 5% loss", txHash: "0xabc...123", beforeStatus: { BTC: 41, ETH: 31, TRX: 19, USDC: 9 }, afterStatus: { BTC: 42, ETH: 28, TRX: 20, USDC: 10 }, gasFee: 0.18, duration: "1 minute", lossAmount: 300 },
        { id: 5, type: "Deposit", date: "2023-09-30", description: "User deposited 1000 USDC", txHash: "0xdef...456", beforeStatus: { BTC: 42, ETH: 28, TRX: 20, USDC: 10 }, afterStatus: { BTC: 39, ETH: 26, TRX: 18, USDC: 17 }, gasFee: 0.05, duration: "30 seconds", depositAmount: 1000 },
        { id: 6, type: "Modify Pool", date: "2023-10-01", description: "Updated rebalancing threshold to 5%", txHash: "0xghi...789", beforeStatus: { BTC: 39, ETH: 26, TRX: 18, USDC: 17 }, afterStatus: { BTC: 39, ETH: 26, TRX: 18, USDC: 17 }, gasFee: 0.08, duration: "45 seconds", oldThreshold: 3, newThreshold: 5 },
    ],
    rebalancingThreshold: 5,
    lastRebalance: "2023-09-25",
    status: "Active"
}
interface Token {
    _id: string;
    symbol: string;
    amount: number;
    proportion: number;
}

interface Pool {
    _id: string;
    userWalletAddress: string;
    poolName: string;
    totalValue: number;
    tokens: Token[];
    rebalancingThreshold: number;
    rebalancingFrequency: string;
    takeProfitPercentage: number;
    stopLossPercentage: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
    poolAddress: string;
    poolBalanceInUSD?: number;
    currentTokenProportion?: bigint[];
    performance?: number
}

export default function SinglePoolPage() {

    const router = useRouter()
    const params = useParams()
    // console.log(params.id)
    const [expandedRows, setExpandedRows] = useState<number[]>([])

    const calculatePerformance = async (currentBalance: number, initialBalance: number) => {
        const performance = ((currentBalance - initialBalance) / initialBalance) * 100
        return performance
    }

    const getStatusIcon = (type: string) => {
        switch (type) {
        case 'Rebalance':
            return <RefreshCcw className="h-4 w-4 text-blue-500" />
        case 'Take Profit':
            return <TrendingUp className="h-4 w-4 text-green-500" />
        case 'Stop Loss':
            return <TrendingDown className="h-4 w-4 text-red-500" />
        case 'Deposit':
            return <ArrowUpRight className="h-4 w-4 text-purple-500" />
        case 'Modify Pool':
            return <BarChart2 className="h-4 w-4 text-orange-500" />
        default:
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />
        }
    }

    const toggleRowExpansion = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }
    const handleDepositFunds = () => {
        router.push("/pool/deposit-token/1")
        // console.log("Deposit more funds")
        // Implement deposit logic here
    }

    const handleModifyPool = () => {
        // console.log("Modify pool")
        // Implement pool modification logic here
    }

    const [singlePool, setSinglePool] = useState<Pool>()


    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    const tronWeb = new TronWeb({
        fullHost: 'https://nile.trongrid.io',
        privateKey
    });

    async function getTokenBalanceInUSDtry(poolAddress: string) {
        try {


            // const PoolContract = await tronWeb.contract().at("TQ9CL6P84NuJ7AyFyWFnRcUDqyZxraScVd");
            const PoolContract = await tronWeb.contract(abi, poolAddress);

            const result = await PoolContract.getTokenBalanceInUSD().call();

            // result contains totalValueInUSD and valueProportions
            const totalValueInUSD = result.totalValueInUSD;
            const valueProportions = result.valueProportions;

            return { totalValue: tronWeb.toDecimal(totalValueInUSD), tokenProportion: valueProportions };

            // console.log(`Is ${address} an operator?`, result);
        } catch (error) {
            console.error("Error calling getTokenBalanceInUSD:", error);
        }
    }


    async function fetchUserPools(poolAddress: string) {
        try {
            const response = await fetch(`/api/pools/get-pool-by-address?poolAddress=${poolAddress}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch pools');
            }
            const poolDataa = data[0];

            const poolBalanceInUSD = await getTokenBalanceInUSDtry(data[0].poolAddress);

            const poolPerformance = await calculatePerformance(poolBalanceInUSD ? poolBalanceInUSD.totalValue : 0, poolDataa.totalValue)
            const usdc = poolBalanceInUSD ? poolBalanceInUSD.totalValue / 10 ** 6 : 0
            const newData = { ...poolDataa, "poolBalanceInUSD": usdc, currentTokenProportion: poolBalanceInUSD?.tokenProportion, performance: poolPerformance }
            setSinglePool(newData);
            console.log('Fetched pools for user:', newData);
        } catch (error) {
            console.error('Error fetching user pools:', error);
        }
    }

    useEffect(() => {
        if (params.id) {
            fetchUserPools(params.id as string)
        }
    }, [params.id])

    const renderPoolStatus = (status: { [key: string]: number }, isAfter: boolean = false) => (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(status).map(([symbol, allocation]) => (
                <div key={symbol} className={`flex flex-col items-center justify-center rounded-lg p-3 transition-all duration-300 border border-border ${isAfter ? 'bg-green-100 shadow-md' : 'bg-background'}`}>
                    <span className="text-sm font-medium text-muted-foreground">{symbol}</span>
                    <span className={`text-2xl font-bold ${isAfter ? 'text-green-600' : 'text-foreground'}`}>{allocation}%</span>
                </div>
            ))}
        </div>
    )

    return (
        <div className="bg-background shadow-custom-strong rounded-xl container min-h-screen p-8">
            {singlePool && singlePool.poolAddress ?
                <div className=" mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center border border-border rounded-lg shadow-lg p-6">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">{singlePool.poolName}</h1>
                            <p className="text-muted-foreground">Created on {formatReadableDateOnly(singlePool.createdAt)}</p>
                        </div>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <Button onClick={handleDepositFunds} className="bg-green-500 hover:bg-green-600">
                                <PlusCircle className="mr-2 h-4 w-4" /> Deposit More Funds
                            </Button>
                            <Button onClick={handleModifyPool} variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
                                <Settings className="mr-2 h-4 w-4" /> Modify Pool
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                                <CardTitle className="text-lg font-medium">Total Balance</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold">${singlePool.poolBalanceInUSD}</div>
                                <p className="text-sm text-gray-400">
                                    Initial Balance: ${(singlePool.totalValue / 10 ** 6).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                                <CardTitle className="text-lg font-medium">Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold">
                                    {singlePool.performance ? singlePool.performance > 0 ?
                                        <div className='text-green-500 flex items-center gap-2'><TrendingUp className="h-4 w-4 text-green-500" />{singlePool.performance}%</div>
                                        : singlePool.performance < 0 ?
                                            <div className='text-red-500 flex items-center gap-2'><TrendingDown className="h-4 w-4 text-red-500" />{singlePool.performance}%</div>
                                            : <>{singlePool.performance} %</>
                                        : "~ 0%"}
                                </div>
                                <p className="text-sm text-gray-400">
                                    Since creation
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                                <CardTitle className="text-lg font-medium">Threshold</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold">{singlePool.rebalancingThreshold}%</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-600 text-white">
                                <CardTitle className="text-lg font-medium">Created On</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{formatReadableDateOnly(singlePool.createdAt)}</div>
                                <p className="text-sm text-gray-400">
                                    {formatReadableTimeWithTimeZone(singlePool.createdAt)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Asset Allocation</CardTitle>
                            <CardDescription>Compare initial and current allocations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {singlePool.tokens.map((asset, index) => (
                                    <div key={asset.symbol} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{asset.symbol} ({asset.symbol})</span>
                                            {/* <span className="text-sm text-foreground">${singlePool.currentTokenProportion
                                                    ? Number(singlePool.currentTokenProportion[index]) / 100
                                                    : 0}</span> */}
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <Progress.Root
                                                className="flex-grow mx-2 bg-gray-200 dark:bg-gray-800 relative h-4 overflow-hidden rounded-full"
                                                value={singlePool.currentTokenProportion
                                                    ? Number(singlePool.currentTokenProportion[index]) / 100
                                                    : 0}>
                                                <Progress.Indicator
                                                    className="h-full w-full flex-1 transition-all bg-gray-800 dark:bg-gray-400"
                                                    style={{
                                                        transform: `translateX(-${100 - (singlePool.currentTokenProportion
                                                            ? Number(singlePool.currentTokenProportion[index]) / 100
                                                            : 0)}%)`
                                                    }}
                                                />
                                            </Progress.Root>

                                            <span className="text-md text-foreground font-medium w-12 text-right">{singlePool.currentTokenProportion
                                                ? Number(singlePool.currentTokenProportion[index]) / 100
                                                : 0}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Initial Allocation: <span className='text-foreground'>{asset.proportion}%</span></span>
                                            {/* <span>Initial Price: ${asset.amount.toLocaleString()}</span> */}
                                            <span>Initial Price: <span className='text-foreground'>$2</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
                            <CardDescription>Recent activities in your pool</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className='hover:bg-transparent'>
                                    <TableRow >
                                        <TableHead>Action</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {poolData.transactions.map((tx) => (
                                        <>
                                            <TableRow key={tx.id} className="cursor-pointer hover:bg-secondary" onClick={() => toggleRowExpansion(tx.id)}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(tx.type)}
                                                        <span>{tx.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>25/09/2024</TableCell>
                                                <TableCell>{tx.description}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm">
                                                        {expandedRows.includes(tx.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.includes(tx.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="bg-background border border-border p-4">
                                                        <div className="grid grid-col-2 gap-4">
                                                            <div>
                                                                <h5 className="font-semibold text-lg text-muted-foreground mb-4">Transaction Details:</h5>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Type:</span> {tx.type}</p>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Date:</span> {tx.date}</p>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Description:</span> {tx.description}</p>
                                                                {/* <p className="text-sm mb-1">
                                                        <span className="font-medium">Tx Hash:</span>{' '}
                                                        <a href={`https://tronscan.org/#/transaction/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                            {tx.txHash} <ExternalLink className="h-3 w-3 inline" />
                                                        </a>
                                                    </p> */}
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Gas Fee:</span> {tx.gasFee} TRX</p>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Duration:</span> {tx.duration}</p>
                                                                {tx.profitAmount && <p className="text-sm mb-1"><span className="font-medium">Profit Amount:</span> ${tx.profitAmount}</p>}
                                                                {tx.lossAmount && <p className="text-sm mb-1"><span className="font-medium">Loss Amount:</span> ${tx.lossAmount}</p>}
                                                                {tx.depositAmount && <p className="text-sm mb-1"><span className="font-medium">Deposit Amount:</span> ${tx.depositAmount}</p>}
                                                                {tx.oldThreshold && <p className="text-sm mb-1"><span className="font-medium">Old Threshold:</span> {tx.oldThreshold}%</p>}
                                                                {tx.newThreshold && <p className="text-sm mb-1"><span className="font-medium">New Threshold:</span> {tx.newThreshold}%</p>}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-lg text-muted-foreground mb-4">Pool Status Change</h4>
                                                                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
                                                                    <div className="flex-1 w-full">
                                                                        <h5 className="text-sm font-medium mb-3 text-muted-foreground">Before:</h5>
                                                                        {renderPoolStatus(tx.beforeStatus)}
                                                                    </div>
                                                                    <ArrowRight className="h-8 w-8 text-gray-400 transform rotate-90 md:rotate-0" />
                                                                    <div className="flex-1 w-full">
                                                                        <h5 className="text-sm font-medium mb-3 text-muted-foreground">After:</h5>
                                                                        {renderPoolStatus(tx.afterStatus, true)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={`https://tronscan.org/#/transaction/${tx.txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-6 text-sm text-white max-w-max px-4 py-3 rounded-lg bg-accent hover:text-blue-600 transition-colors duration-200 flex items-center"
                                                        >
                                                            View Transaction <ExternalLink className="h-4 w-4 ml-1" />
                                                        </a>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                :
                <div className=" mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center border border-border rounded-lg shadow-lg p-6">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">{poolData.name}</h1>
                            <p className="text-muted-foreground">Created on {poolData.createdAt}</p>
                        </div>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <Button onClick={handleDepositFunds} className="bg-green-500 hover:bg-green-600">
                                <PlusCircle className="mr-2 h-4 w-4" /> Deposit More Funds
                            </Button>
                            <Button onClick={handleModifyPool} variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
                                <Settings className="mr-2 h-4 w-4" /> Modify Pool
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                                <CardTitle className="text-lg font-medium">Total Balance</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold">${poolData.currentBalance.toLocaleString()}</div>
                                <p className="text-sm text-gray-500">
                                    Initial: ${poolData.initialBalance.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                                <CardTitle className="text-lg font-medium">Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold">
                                </div>
                                <p className="text-sm text-gray-500">
                                    Since creation
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                                <CardTitle className="text-lg font-medium">Last Rebalance</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold">{poolData.lastRebalance}</div>
                                <p className="text-sm text-gray-500">
                                    Threshold: {poolData.rebalancingThreshold}%
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-600 text-white">
                                <CardTitle className="text-lg font-medium">Created On</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold">{poolData.createdAt}</div>
                                <p className="text-sm text-gray-500">
                                    {poolData.createdAt}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Asset Allocation</CardTitle>
                            <CardDescription>Compare initial and current allocations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {poolData.assets.map((asset) => (
                                    <div key={asset.symbol} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{asset.name} ({asset.symbol})</span>
                                            <span className="text-sm text-foreground">${asset.currentPrice.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <Progress.Root
                                                className="flex-grow mx-2 bg-gray-200 dark:bg-gray-800 relative h-4 overflow-hidden rounded-full"
                                                value={asset.currentAllocation}>
                                                <Progress.Indicator
                                                    className="h-full w-full flex-1 transition-all bg-gray-800 dark:bg-gray-400"
                                                    style={{ transform: `translateX(-${100 - asset.currentAllocation}%)` }}
                                                />
                                            </Progress.Root>

                                            <span className="text-md text-foreground font-medium w-12 text-right">{asset.currentAllocation}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Initial: {asset.initialAllocation}%</span>
                                            <span>Initial Price: ${asset.initialPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
                            <CardDescription>Recent activities in your pool</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className='hover:bg-transparent'>
                                    <TableRow >
                                        <TableHead>Action</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {poolData.transactions.map((tx) => (
                                        <>
                                            <TableRow key={tx.id} className="cursor-pointer hover:bg-secondary" onClick={() => toggleRowExpansion(tx.id)}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(tx.type)}
                                                        <span>{tx.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>25/09/2024</TableCell>
                                                <TableCell>{tx.description}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm">
                                                        {expandedRows.includes(tx.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.includes(tx.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="bg-background border border-border p-4">
                                                        <div className="grid grid-col-2 gap-4">
                                                            <div>
                                                                <h5 className="font-semibold text-lg text-muted-foreground mb-4">Transaction Details:</h5>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Type:</span> {tx.type}</p>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Date:</span> {tx.date}</p>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Description:</span> {tx.description}</p>
                                                                {/* <p className="text-sm mb-1">
                                                                <span className="font-medium">Tx Hash:</span>{' '}
                                                                <a href={`https://tronscan.org/#/transaction/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                                    {tx.txHash} <ExternalLink className="h-3 w-3 inline" />
                                                                </a>
                                                            </p> */}
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Gas Fee:</span> {tx.gasFee} TRX</p>
                                                                <p className="text-sm mb-1"><span className="font-medium text-muted-foreground">Duration:</span> {tx.duration}</p>
                                                                {tx.profitAmount && <p className="text-sm mb-1"><span className="font-medium">Profit Amount:</span> ${tx.profitAmount}</p>}
                                                                {tx.lossAmount && <p className="text-sm mb-1"><span className="font-medium">Loss Amount:</span> ${tx.lossAmount}</p>}
                                                                {tx.depositAmount && <p className="text-sm mb-1"><span className="font-medium">Deposit Amount:</span> ${tx.depositAmount}</p>}
                                                                {tx.oldThreshold && <p className="text-sm mb-1"><span className="font-medium">Old Threshold:</span> {tx.oldThreshold}%</p>}
                                                                {tx.newThreshold && <p className="text-sm mb-1"><span className="font-medium">New Threshold:</span> {tx.newThreshold}%</p>}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-lg text-muted-foreground mb-4">Pool Status Change</h4>
                                                                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
                                                                    <div className="flex-1 w-full">
                                                                        <h5 className="text-sm font-medium mb-3 text-muted-foreground">Before:</h5>
                                                                        {renderPoolStatus(tx.beforeStatus)}
                                                                    </div>
                                                                    <ArrowRight className="h-8 w-8 text-gray-400 transform rotate-90 md:rotate-0" />
                                                                    <div className="flex-1 w-full">
                                                                        <h5 className="text-sm font-medium mb-3 text-muted-foreground">After:</h5>
                                                                        {renderPoolStatus(tx.afterStatus, true)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={`https://tronscan.org/#/transaction/${tx.txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-6 text-sm text-white max-w-max px-4 py-3 rounded-lg bg-accent hover:text-blue-600 transition-colors duration-200 flex items-center"
                                                        >
                                                            View Transaction <ExternalLink className="h-4 w-4 ml-1" />
                                                        </a>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            }
        </div>
    )
}
