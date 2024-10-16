'use client'

import React, { useEffect, useState } from 'react'
import { ArrowRight, Search, BarChart2, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
import * as Progress from '@radix-ui/react-progress';
// import { Progress } from "@/components/ui/progress"
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks'
import Link from 'next/link'
import abi from '@/abis/PoolContract.json'
import { TronWeb } from "tronweb"



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
}

// Example usage
const UserPoolsList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [userPools, setUserPools] = useState<Pool[]>([])
    const [filteredPools, setFilteredPools] = useState<Pool[]>([])
    const [loading, setLoading] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // const [tronWeb, setTronWeb] = useState<any>();
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    const tronWeb = new TronWeb({
        fullHost: 'https://nile.trongrid.io',
        privateKey
    });
    const { address } = useWallet();

    useEffect(() => {
        if (address) {
            fetchUserPools(address);
        }
    }, [address])


    useEffect(() => {
        setFilteredPools(userPools?.filter(pool =>
            pool.poolName.toLowerCase().includes(searchTerm.toLowerCase())))
    }, [searchTerm])




    // const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    async function getTokenBalanceInUSDtry(poolAddress: string) {
        try {
            // Call the isOperator function
            console.log(poolAddress)

            const PoolContract = await tronWeb.contract(abi.abi, poolAddress);
            console.log(await PoolContract)
            const result = await PoolContract.getTokenBalanceInUSD().call();

            // result contains totalValueInUSD and valueProportions
            const totalValueInUSD = result.totalValueInUSD;
            const valueProportions = result.valueProportions;

            console.log(`Total Value in USD: ${tronWeb.toDecimal(totalValueInUSD)}`);
            console.log(`Value Proportions: ${valueProportions}`);

            return { totalValue: tronWeb.toDecimal(totalValueInUSD), tokenProportion: valueProportions };

            // console.log(`Is ${address} an operator?`, result);
        } catch (error) {
            console.error("Error calling getTokenBalanceInUSD:", error);
        }
    }

    async function fetchUserPools(walletAddress: string) {
        setLoading(true);
        try {
            const response = await fetch(`/api/pools/get-user-pools?userWalletAddress=${walletAddress}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch pools');
            }

            const updatedPools = await Promise.all(data.map(async (pool: Pool) => {
                const poolBalanceInUSD = await getTokenBalanceInUSDtry(pool.poolAddress);
                const totalValue = poolBalanceInUSD?.totalValue ? poolBalanceInUSD.totalValue / 10 ** 6 : 0
                return { ...pool, poolBalanceInUSD: totalValue, currentTokenProportion: poolBalanceInUSD?.tokenProportion }; // Return a new object with `poolBalanceInUSD` added
            }));
            // console.log(updatedPools);
            setUserPools(updatedPools);
            setFilteredPools(updatedPools);
            console.log('Fetched pools for user:', updatedPools);
        } catch (error) {
            console.error('Error fetching user pools:', error);
        } finally {
            setLoading(false);
        }
    }


    const handleViewMore = (poolId: string) => {
        // In a real application, this would navigate to the single pool page
        console.log(`Navigating to pool ${poolId}`)
        // Example: router.push(`/pools/${poolId}`)
    }





    return (
        <div className="p-6 rounded-xl w-full mb-4 min-h-screen p-8">
            <div className="container mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-foreground">My Pools</h1>
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground" />
                        <Input
                            placeholder="Search pools"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 py-6 text-lg rounded-full shadow-lg bg-transparent text-foreground"
                        />
                    </div>
                </div>


                {loading ? (
                    // Skeleton Loader
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, idx) => (
                            <Card key={idx} className="overflow-hidden transition-shadow duration-1000 hover:shadow-lg flex flex-col animate-pulse">
                                <CardHeader className="bg-gray-200 dark:bg-gray-600 h-16"></CardHeader>
                                <CardContent className="pt-6 flex-1 bg-gray-100 dark:bg-transparent">
                                    <div className="h-6 bg-gray-300 dark:bg-gray-600 w-1/2 mb-4"></div>
                                    <div className="h-6 bg-gray-300 dark:bg-gray-600 w-1/3 mb-6"></div>
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 w-full"></div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-gray-300 dark:bg-gray-600 h-12"></CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div>
                        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                            {filteredPools.length > 0 ? (
                                filteredPools.map((pool) => (
                                    <Link href={`/pool/${pool.poolAddress}`} key={pool._id}>
                                        <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg flex flex-col">
                                            <CardHeader className="bg-secondary text-secondary-foreground ">
                                                <div className="flex justify-between items-center ">
                                                    <CardTitle className="text-2xl font-bold">{pool.poolName}</CardTitle>
                                                    {/* <Badge variant={pool.status === 'Active' ? 'outline' : 'secondary'} className="text-xs px-2 py-1">
                                        {pool.status}
                                    </Badge> */}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-6 flex-1 bg-background">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-sm font-medium text-muted-foreground">Balance</span>
                                                    <span className="text-2xl font-bold"><span className='text-lg text-muted-foreground font-semibold'>$</span>{pool.poolBalanceInUSD}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-sm font-medium text-muted-foreground">Performance</span>
                                                    {/* <div className={flex items-center ${pool.performance >= 0 ? 'text-green-600' : 'text-red-600'}}>
                                        {pool.performance >= 0 ? <TrendingUp className="mr-1 h-5 w-5" /> : <TrendingDown className="mr-1 h-5 w-5" />}
                                        <span className="text-xl font-bold">{pool.performance >= 0 ? '+' : ''}{pool.performance}%</span>
                                    </div> */}
                                                </div>
                                                <div className="mb-6">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-sm font-medium text-muted-foreground">Asset Allocation</span>
                                                        <span className='text-sm font-medium text-muted-foreground gap-1 flex items-center'>Current<BarChart2 className="h-4 w-4 text-muted-foreground" /></span>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {pool.tokens.map((asset, index) => (
                                                            <React.Fragment key={index}>
                                                                <div key={asset.symbol} className="flex items-center">
                                                                    <span className=" text-sm font-medium text-foreground">{asset.symbol}</span>
                                                                    <Progress.Root
                                                                        className="flex-grow mx-2 bg-gray-200 dark:bg-gray-800 relative h-4 overflow-hidden rounded-full"
                                                                        value={pool.currentTokenProportion
                                                                            ? Number(pool.currentTokenProportion[index]) / 100
                                                                            : 0}>
                                                                        <Progress.Indicator
                                                                            className="h-1/2 w-full flex-1 transition-all bg-accent"
                                                                            style={{
                                                                                transform: `translateX(-${100 - (pool.currentTokenProportion
                                                                                    ? Number(pool.currentTokenProportion[index]) / 100
                                                                                    : 0)}%)`
                                                                            }}
                                                                        />
                                                                        <Progress.Indicator
                                                                            className="h-1/2 w-full flex-1 transition-all bg-gray-500 dark:bg-gray-400"
                                                                            style={{
                                                                                transform: `translateX(-${100 - asset.proportion}%)`
                                                                            }}
                                                                        />
                                                                    </Progress.Root>
                                                                    <span className="w-12 text-sm text-right">{(pool.currentTokenProportion
                                                                        ? Number(pool.currentTokenProportion[index]) / 100
                                                                        : 0)}%</span>
                                                                </div>
                                                            </React.Fragment>
                                                        ))}
                                                        <div className="flex justify-between text-sm font-medium text-muted-foreground mt-2">
                                                            <div className="flex items-center">
                                                                <div className="w-3 h-3 bg-gray-500 dark:bg-gray-400 mr-1"></div>
                                                                <span>Initial</span>
                                                            </div>
                                                            <div className="flex items-center ">
                                                                <div className="w-3 h-3 bg-accent mr-1"></div>
                                                                <span>Current</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <RefreshCcw className="mr-1 h-4 w-4" />
                                                        <span>Rebalance at <span className='text-foreground font-bold'>{pool.rebalancingThreshold}%</span> drift</span>
                                                    </div>
                                                    <span>Last: 25/09/2024</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-background">
                                                <Button className="w-full text-white bg-purple-600 hover:bg-purple-700" onClick={() => handleViewMore(pool.poolAddress)}>
                                                    View Details
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center mt-12">
                                    <p className="text-xl text-gray-600">No pools found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
export default UserPoolsList;

