'use client'
import React, { useEffect, useState } from 'react'
import { ArrowUpRight, TrendingUp, TrendingDown, BarChart2, RefreshCcw, ChevronDown, ChevronUp, ExternalLink, PlusCircle, Settings, ArrowRight, ChevronLeft, TriangleAlert, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import * as Progress from "@radix-ui/react-progress"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from 'next/navigation'
import { TronWeb } from "tronweb"
import { abi } from '@/abis/PoolContract.json'
import { formatReadableDateOnly, formatReadableTimeWithTimeZone } from '@/lib/dateFormatter'
import Link from 'next/link'
import factoryAbi from '../abis/PoolFactory.json'
import tokenAbi from "../abis/Token.json";

interface Token {
    _id: string;
    symbol: string;
    amount: number;
    proportion: number;
    takeProfitPercentage: number;
    stopLossAtTokenPrice: number;
    initialTokenPriceInUSD: number;
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

interface TokenAllocation {
    tokenName: string;
    tokenPercentage: number;
    _id: string;
}

interface Transaction {
    _id: string;
    type: string;
    txHash: string;
    description: string;
    tokenBefore: TokenAllocation[];
    tokenAfter: TokenAllocation[];
    amount: number;
    user: string;
    pool: string;
    txDate: string;
    __v: number;
}


const tokens: { [key: string]: string } = {
    "SYX": "TWYiT6zVWEH8gkp14YSPTyTjt8MXNbvVud",
    "SYY": "TUQJvMCiPfaYLDyQg8cKkK64JSkUVZh4qq",
    "SYZ": "TRjfuFK3hZvx2nDhNM1khy1t15G8xb21Us",
    "USDT": "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf"
};

export default function SinglePoolPage() {

    const router = useRouter()
    const params = useParams()
    // console.log(params.id)
    const [expandedRows, setExpandedRows] = useState<string[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [singlePool, setSinglePool] = useState<Pool>()
    const [loading, setLoading] = useState<boolean>(false)
    const [emergencyLoading, setEmergencyLoading] = useState<boolean>(false)
    const [tokenPrices, setTokenPrices] = useState<number[]>([])
    const [userAddress, setUserAddress] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tronWeb, setTronWeb] = useState<any>(null);

    useEffect(() => {
        const initTronWeb = async () => {
            if (typeof window !== 'undefined' && window.tronWeb) {
                const tronInstance = window.tronWeb;

                // Check if defaultAddress and base58 exist
                const defaultAddress = tronInstance?.defaultAddress?.base58;

                if (defaultAddress) {
                    console.log("tronnnnn", tronInstance)
                    setTronWeb(tronInstance);
                    setUserAddress(defaultAddress);
                } else {
                    console.error('No default address found in TronLink.');
                }
            } else {
                console.error('TronLink is not installed or not logged in.');
            }
        };

        initTronWeb();
    }, []);

    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    const tronWebGetter = new TronWeb({
        fullHost: 'https://nile.trongrid.io',
        privateKey
    });

    const calculatePerformance = async (currentBalance: number, initialBalance: number) => {
        console.log("first value current balance", currentBalance)
        console.log("first value initialBalance", initialBalance)
        const performance = ((currentBalance - initialBalance) / initialBalance) * 100
        return performance
    }

    const getStatusIcon = (type: string) => {
        switch (type.toLowerCase()) {
        case 'rebalance':
            return <RefreshCcw className="h-4 w-4 text-blue-500" />
        case 'take-profit':
            return <TrendingUp className="h-4 w-4 text-green-500" />
        case 'stop-loss':
            return <TrendingDown className="h-4 w-4 text-red-500" />
        case 'deposit':
            return <ArrowUpRight className="h-4 w-4 text-purple-500" />
        case 'modify':
            return <BarChart2 className="h-4 w-4 text-orange-500" />
        default:
            return <Clock className="h-4 w-4 text-yellow-500" />
        }
    }

    const toggleRowExpansion = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const fetchTokenBalances = async (): Promise<{ tokenAddresses: string[], tokenBalances: number[] } | undefined> => {
        const tokenArray = singlePool?.tokens;
        // Ensure tokenArray exists before proceeding
        if (!tokenArray) {
            console.error("No tokens found in singlePool");
            return;
        }
        const tokenAddresses = []
        const tokenBalances = []

        for (const token of tokenArray) {
            const tokenAddress = tokens[token.symbol];
            tokenAddresses.push(tokenAddress);
            // Ensure tokenAddress exists in tokens mapping
            if (!tokenAddress) {
                console.error(`No token address found for symbol: ${token.symbol}`);
                continue;
            }
            try {
                const contract = await tronWebGetter.contract(tokenAbi.abi, tokenAddress);
                const balance = await contract.methods.balanceOf(singlePool.poolAddress).call();

                tokenBalances.push(Number(balance));
            } catch (error) {
                console.error(`Error fetching Balance for ${token.symbol}:`, error);
            }
        }

        // for USDT
        try {
            const contract = await tronWebGetter.contract(tokenAbi.abi, tokens["USDT"]);
            const balance = await contract.methods.balanceOf(singlePool.poolAddress).call();
            tokenBalances.push(Number(balance));

        } catch (error) {
            console.error(`Error fetching Balance for USDT:`, error);
        }

        tokenAddresses.push(tokens["USDT"]);

        return { tokenAddresses, tokenBalances };
    }

    const emergencyWithdraw = async () => {
        setEmergencyLoading(true);
        try {
            const poolContract = await tronWeb.contract(abi, singlePool?.poolAddress);
            const params = await fetchTokenBalances();
            console.log("Params : ", params);
            console.log("Withdrawing Tokens ...");
            const withdraw = await poolContract.withdrawTokens(params?.tokenAddresses, params?.tokenBalances).send({
                feeLimit: 100 * 1e6,
                callValue: 0,
                from: userAddress
            });
            console.log("Token Withdrawal Successful : ", withdraw);
        }
        catch (error) {
            console.log("error Withdrawing Tokens: ", error);
            if (error) {
                return;
            }
        } finally {
            setEmergencyLoading(false)
        }
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




    async function getTokenBalanceInUSDtry(poolAddress: string) {
        try {
            // const PoolContract = await tronWeb.contract().at("TQ9CL6P84NuJ7AyFyWFnRcUDqyZxraScVd");
            const PoolContract = await tronWebGetter.contract(abi, poolAddress);

            const result = await PoolContract.getTokenBalanceInUSD().call();
            console.log("result from token contract", result)
            // result contains totalValueInUSD and valueProportions
            const totalValueInUSD = result.totalValueInUSD;
            const valueProportions = result.valueProportions;

            return { totalValue: parseInt(totalValueInUSD, 10), tokenProportion: valueProportions };

            // console.log(`Is ${address} an operator?`, result);
        } catch (error) {
            console.error("Error calling getTokenBalanceInUSD:", error);
        }
    }


    async function fetchUserPool(poolAddress: string) {
        setLoading(true)
        try {
            const response = await fetch(`/api/pools/get-pool-by-address?poolAddress=${poolAddress}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch pools');
            }
            const poolDataa = data[0];

            const poolBalanceInUSD = await getTokenBalanceInUSDtry(data[0].poolAddress);
            console.log("poolBalanceInUSD", poolBalanceInUSD)
            console.log("pool Initial", poolDataa.totalValue)

            const poolPerformance = await calculatePerformance(poolBalanceInUSD ? poolBalanceInUSD.totalValue / 10 ** 6 : 0, poolDataa.totalValue)
            const usdc = poolBalanceInUSD ? poolBalanceInUSD.totalValue / 10 ** 6 : 0
            const newData = { ...poolDataa, "poolBalanceInUSD": usdc, currentTokenProportion: poolBalanceInUSD?.tokenProportion, performance: poolPerformance }
            setSinglePool(newData);

            console.log('Fetched pools for user:', newData);
        } catch (error) {
            console.error('Error fetching user pools:', error);
        }
        finally {
            setLoading(false)
        }
    }



    async function fetchTxHistory(poolAddress: string) {
        setLoading(true)
        try {
            const response = await fetch(`/api/pools/transactions/get-pool-txs?poolId=${poolAddress}`);
            const data = await response.json();
 
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch pools');
            }
            
            // setTransactions(data.transactions || []);
            // Reverse the order of transactions
            const reversedTransactions = (data.transactions || []).reverse();
            setTransactions(reversedTransactions);
            console.log("Tx History: ", data.transactions);
 
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    }

    const fetchTokenPrices = async (): Promise<void> => {
        console.log("Entering into fetchTokenPrices ....");
        const tokenArray = singlePool?.tokens;

        // Ensure tokenArray exists before proceeding
        if (!tokenArray) {
            console.error("No tokens found in singlePool");
            return;
        }

        const prices: number[] = [];

        // Use for...of to handle async/await
        for (const token of tokenArray) {
            try {
                const tokenAddress = tokens[token.symbol];

                // Ensure tokenAddress exists in tokens mapping
                if (!tokenAddress) {
                    console.error(`No token address found for symbol: ${token.symbol}`);
                    continue;
                }

                // Fetch the price from the factory contract
                const factoryContractInstance = await tronWebGetter.contract(factoryAbi.abi, factoryAbi.contractAddress);
                const priceRaw = await factoryContractInstance.getOnChainPrice(tokenAddress).call();
                const price = parseInt(priceRaw, 10) / 10 ** 6; // Adjust the price scale as needed
                prices.push(price);
            } catch (error) {
                console.error(`Error fetching price for ${token.symbol}:`, error);
            }
        }
        console.log("Prices: ", prices);
        // Set the token prices after fetching all
        setTokenPrices(prices);
    };


    useEffect(() => {
        if (params.id) {
            fetchUserPool(params.id as string)
            fetchTxHistory(params.id as string)
        }
    }, [params.id])

    useEffect(() => {
        fetchTokenPrices();
    }, [singlePool]);

    const renderPoolStatus = (tokens: TokenAllocation[], isAfter: boolean = false) => (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tokens.map((token) => (
                <div
                    key={token._id}
                    className={`flex flex-col items-center justify-center rounded-lg p-3 transition-all duration-300 border border-border ${isAfter ? 'bg-green-100 shadow-md' : 'bg-background'
                        }`}
                >
                    <span className="text-sm font-medium text-muted-foreground">
                        {token.tokenName}
                    </span>
                    <span className={`text-2xl font-bold ${isAfter ? 'text-green-600' : 'text-foreground'}`}>
                        {token.tokenPercentage.toFixed(2)}%
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <div
                className='container px-8 pb-4'>
                <Link
                    href={"/dashboard"}
                    className='flex items-center hover:text-accent font-semibold'>
                    <ChevronLeft />Back to Dashboard
                </Link>
            </div>
            <div className="bg-background shadow-custom-strong rounded-xl container min-h-screen p-8">
                {loading ?
                    <div className=" mx-auto space-y-8">
                        <div className='flex items-center gap-4'>
                            <div className="animate-spin rounded-full border-2 border-current border-t-transparent h-5 w-5"></div>
                            <span className='animate-pulse text-secondary-foreground'>Fetching pool details...</span>
                        </div>

                        <div className="animate-pulse bg-gray-200 dark:bg-gray-800 flex flex-col md:flex-row justify-between items-center border border-border rounded-lg shadow-lg">
                            <div className='h-32 w-full '></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                                    <CardTitle className="text-lg font-medium">Total Balance</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-3">
                                    <div className="rounded-lg h-8 w-full animate-pulse bg-gray-200 dark:bg-gray-800"></div>
                                    <p className="rounded-lg h-6 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                                    <CardTitle className="text-lg font-medium">Performance</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-3">
                                    <div className="rounded-lg h-8 w-full animate-pulse bg-gray-200 dark:bg-gray-800"></div>
                                    <p className="rounded-lg h-6 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                                    <CardTitle className="text-lg font-medium">Threshold</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-3">
                                    <div className="rounded-lg h-8 w-full animate-pulse bg-gray-200 dark:bg-gray-800"></div>
                                    <p className="rounded-lg h-6 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-600 text-white">
                                    <CardTitle className="text-lg font-medium">Created On</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-3">
                                    <div className="rounded-lg h-8 w-full animate-pulse bg-gray-200 dark:bg-gray-800"></div>
                                    <p className="rounded-lg h-6 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
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
                                    <div className="space-y-2">
                                        <div className="rounded-lg space-x-4 h-12 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                        </div>
                                        <div className="rounded-lg space-x-4 h-12 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                        </div>
                                        <div className="rounded-lg space-x-4 h-12 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500">
                                        </div>
                                    </div>
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
                                </Table>
                                <div className="space-y-6 mt-4">
                                    <div className="space-y-2">
                                        <div className="rounded-lg space-x-4 h-14 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                        </div>
                                        <div className="rounded-lg space-x-4 h-14 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                        </div>
                                        <div className="rounded-lg space-x-4 h-14 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                        </div>
                                        <div className="rounded-lg space-x-4 h-14 w-full animate-pulse bg-gray-200 dark:bg-gray-800">
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div> : singlePool && singlePool.poolAddress ?
                        <div className=" mx-auto space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-center border border-border rounded-lg shadow-lg p-6">
                                <div>
                                    <h1 className="text-4xl font-bold text-foreground mb-2">{singlePool.poolName}</h1>
                                    <p className="text-muted-foreground">Created on {formatReadableDateOnly(singlePool.createdAt)}</p>
                                </div>
                                <div className="flex space-x-4 mt-4 md:mt-0">
                                    <Button
                                        onClick={emergencyWithdraw}
                                        className="bg-red-500 hover:bg-red-600"
                                        disabled={emergencyLoading}>
                                        {emergencyLoading ? (
                                            <> <span className="spinner-border spinner-border-sm mr-2"></span> {/* Spinner for loading */} Processing... </>
                                        ) : (
                                            <>
                                                <TriangleAlert className="mr-2 h-4 w-4" /> Emergency Withdrawal
                                            </>
                                        )}
                                    </Button>
                                    <Button onClick={handleDepositFunds} className="bg-green-500 hover:bg-green-600" disabled>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Deposit More Funds
                                    </Button>
                                    <Button onClick={handleModifyPool} disabled variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
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
                                            Invested: ${(singlePool.totalValue).toLocaleString()}
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
                                                <div className='text-green-500 flex items-center gap-2'><TrendingUp className="h-4 w-4 text-green-500" />{singlePool.performance.toFixed(2)}%</div>
                                                : singlePool.performance < 0 ?
                                                    <div className='text-red-500 flex items-center gap-2'><TrendingDown className="h-4 w-4 text-red-500" />{singlePool.performance.toFixed(2)}%</div>
                                                    : <>{singlePool.performance.toFixed(2)} %</>
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
                                                    <div className='text-sm text-gray-500'>
                                                        <span>Current Price: <span className='text-foreground'>${tokenPrices[index]} </span></span>

                                                        <span>Initial Price: <span className='text-foreground'>${asset.initialTokenPriceInUSD}</span></span>
                                                    </div>
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
                                        <TableHeader className="hover:bg-transparent">
                                            <TableRow>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((tx, index) => (
                                                <React.Fragment key={index}>
                                                    <TableRow
                                                        className="cursor-pointer hover:bg-secondary"
                                                        onClick={() => toggleRowExpansion(tx._id)}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                {getStatusIcon(tx.type)}
                                                                <span>{tx.type}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{formatReadableDateOnly(tx.txDate)}</TableCell>
                                                        <TableCell>{tx.description}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="sm">
                                                                {expandedRows.includes(tx._id) ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedRows.includes(tx._id) && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="bg-background border border-border p-4">
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    <div>
                                                                        <h5 className="font-semibold text-lg text-muted-foreground mb-4">
                                                                            Transaction Details:
                                                                        </h5>
                                                                        <div className="space-y-2">
                                                                            <p className="text-sm mb-1">
                                                                                <span className="font-medium text-muted-foreground">Type:</span> {tx.type}
                                                                            </p>
                                                                            <p className="text-sm mb-1">
                                                                                <span className="font-medium text-muted-foreground">Date:</span> {formatReadableDateOnly(tx.txDate)} {formatReadableTimeWithTimeZone(tx.txDate)}
                                                                            </p>
                                                                            <p className="text-sm mb-1">
                                                                                <span className="font-medium text-muted-foreground">Description:</span> {tx.description}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-semibold text-lg text-muted-foreground mb-4">Pool Status Change</h4>
                                                                        <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
                                                                            <div className="flex-1 w-full">
                                                                                <h5 className="text-sm font-medium mb-3 text-muted-foreground">Before:</h5>
                                                                                {renderPoolStatus(tx.tokenBefore)}
                                                                            </div>
                                                                            <ArrowRight className="h-8 w-8 text-gray-400 transform rotate-90 md:rotate-0" />
                                                                            <div className="flex-1 w-full">
                                                                                <h5 className="text-sm font-medium mb-3 text-muted-foreground">After:</h5>
                                                                                {renderPoolStatus(tx.tokenAfter, true)}
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
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            {/* <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
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
                                            {poolData.transactions.map((tx, index) => (
                                                <React.Fragment key={index}>
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
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card> */}
                        </div>
                        :
                        <div className=" mx-auto space-y-8">
                            <div className="text-center mt-12">
                                <p className="text-xl text-gray-600">Unable to fetch the details of this pool. Please try again after some time.</p>
                            </div>
                        </div>
                }
            </div></>
    )
}
