'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Search, TrendingUp, TrendingDown, BarChart2, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
import * as Progress from '@radix-ui/react-progress';
// import { Progress } from "@/components/ui/progress"
import { CryptoPrices } from '../lib/fetchCryptoPrices';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks'

// Mock data - replace with actual data fetching in a real application
// const userPools = [
//     {
//         id: 1,
//         name: "Balanced Growth",
//         balance: 10500,
//         performance: 5.0,
//         lastRebalance: "2023-09-25T11:30:00Z",
//         status: "Active",
//         assets: [
//             { symbol: "BTC", allocation: 40 },
//             { symbol: "ETH", allocation: 30 },
//         ],
//         rebalanceThreshold: 5
//     },
//     {
//         id: 2,
//         name: "High Risk",
//         balance: 8000,
//         performance: -2.5,
//         lastRebalance: "2023-09-26T14:45:00Z",
//         status: "Active",
//         assets: [
//             { symbol: "BTC", allocation: 60 },
//             { symbol: "ETH", allocation: 40 }
//         ],
//         rebalanceThreshold: 10
//     },
//     {
//         id: 3,
//         name: "Stablecoin",
//         balance: 5000,
//         performance: 0.5,
//         lastRebalance: "2023-09-27T09:15:00Z",
//         status: "Paused",
//         assets: [
//             { symbol: "BTC", allocation: 40 },
//             { symbol: "ETH", allocation: 30 },
//         ],
//         rebalanceThreshold: 1
//     },
//     {
//         id: 4,
//         name: "DeFi Yield",
//         balance: 12000,
//         performance: 8.2,
//         lastRebalance: "2023-09-24T16:20:00Z",
//         status: "Active",
//         assets: [
//             { symbol: "BTC", allocation: 40 },
//             { symbol: "ETH", allocation: 30 },
//         ],
//         rebalanceThreshold: 7.5
//     },
//     {
//         id: 5,
//         name: "Bitcoin Maximalist",
//         balance: 15000,
//         performance: 3.7,
//         lastRebalance: "2023-09-23T10:00:00Z",
//         status: "Active",
//         assets: [
//             { symbol: "BTC", allocation: 100 },
//         ],
//         rebalanceThreshold: 0
//     },
// ]

// [
//     {
//         "_id": "6704e87348b5f51dd0b3e86b",
//         "userWalletAddress": "TYZGL81XhUUmke5RHfX1waTkuqy6tVo8SA",
//         "poolName": "My First Pool",
//         "totalValue": 4000000,
//         "tokens": [
//             {
//                 "symbol": "SyncX",
//                 "amount": 1,
//                 "proportion": 50,
//                 "_id": "66ffb5cbfbbf4c246b90a3b2"
//             },
//             {
//                 "symbol": "SyncY",
//                 "amount": 1,
//                 "proportion": 50,
//                 "_id": "66ffb5cbfbbf4c246b90a3b3"
//             }
//         ],
//         "rebalancingThreshold": 10,
//         "rebalancingFrequency": "daily",
//         "takeProfitPercentage": 200,
//         "stopLossPercentage": 1,
//         "createdAt": "2024-10-04T09:30:51.006Z",
//         "updatedAt": "2024-10-04T09:30:51.006Z",
//         "__v": 0,
//         "poolAddress": "TYda8NoMYJDWHTSQBtr9aZ3ayt4E7CcLnv"
//     },
//     {
//         "_id": "6704eadb0584e9e37c4b8f8f",
//         "userWalletAddress": "TYZGL81XhUUmke5RHfX1waTkuqy6tVo8SA",
//         "poolName": "MY_POOL",
//         "totalValue": 4000000,
//         "tokens": [
//             {
//                 "symbol": "SCX",
//                 "amount": 1,
//                 "proportion": 50,
//                 "_id": "6704eadb0584e9e37c4b8f90"
//             },
//             {
//                 "symbol": "SCY",
//                 "amount": 1,
//                 "proportion": 50,
//                 "_id": "6704eadb0584e9e37c4b8f91"
//             }
//         ],
//         "rebalancingThreshold": 10,
//         "rebalancingFrequency": "3600",
//         "takeProfitPercentage": 30,
//         "stopLossPercentage": 5,
//         "createdAt": "2024-10-08T08:18:35.807Z",
//         "updatedAt": "2024-10-08T08:18:35.807Z",
//         "__v": 0
//     }
// ]


// Example usage
const UserPoolsList: React.FC<{ prices: CryptoPrices }> = ({ prices }) => {
    console.log("Pricesss", prices)
    const [searchTerm, setSearchTerm] = useState('')
    const [userPools, setUserPools] = useState([])


    const { address } = useWallet();

    const [userAddress, setUserAddress] = useState<string | null>(address ? address : "");
    useEffect(() => {
        if (address) {
            setUserAddress(address)
            fetchUserPools(address);
        }
    }, [address])

    const filteredPools = userPools?.filter(pool =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase())
    )


    async function fetchUserPools(walletAddress: string) {
        try {
            const response = await fetch(`/api/pools/get-user-pools?walletAddress=${walletAddress}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch pools');
            }
            setUserPools(data);

            console.log('Fetched pools for user:', data);
        } catch (error) {
            console.error('Error fetching user pools:', error);
        }
    }


    // fetchUserPools('0x1234567890123456789012345678901234567890');

    const handleViewMore = (poolId: number) => {
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

                {/* <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPools.map((pool) => (
                        <Card key={pool.id} className="overflow-hidden transition-shadow border border-[#777777] bg-transparent duration-300 hover:shadow-lg flex flex-col justify-start">
                            <CardHeader className="bg-white border-b text-black">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-2xl font-bold">{pool.name}</CardTitle>
                                    <Badge variant={pool.status === 'Active' ? 'default' : 'secondary'} className="text-xs px-2 py-1">
                                        {pool.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-gray-400">Balance</span>
                                    <span className="text-2xl font-bold text-white">${pool.balance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-sm font-medium text-gray-400">Performance</span>
                                    <div className={`flex items-center ${pool.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {pool.performance >= 0 ? <TrendingUp className="mr-1 h-5 w-5" /> : <TrendingDown className="mr-1 h-5 w-5" />}
                                        <span className="text-xl font-bold">{pool.performance >= 0 ? '+' : ''}{pool.performance}%</span>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-400">Asset Allocation</span>
                                        <BarChart2 className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="space-y-2 text-white">
                                        {pool.assets.map((asset) => (
                                            <div key={asset.symbol} className="flex items-center">
                                                <span className="w-12 text-sm font-medium">{asset.symbol}</span>
                                                <Progress.Root className="flex-grow mx-2 bg-gray-700 relative h-4 w-full overflow-hidden rounded-full" value={asset.allocation}>
                                                    <Progress.Indicator
                                                        className="h-full w-full flex-1 transition-all bg-gray-500"
                                                        style={{ transform: `translateX(-${100 - asset.allocation}%)` }}
                                                    />
                                                </Progress.Root>
                                                <span className="w-8 text-sm text-right">{asset.allocation}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <RefreshCcw className="mr-1 h-4 w-4" />
                                        <span className='text-gray-400'>Rebalance at <span className='text-white'>{pool.rebalanceThreshold}%</span> drift</span>
                                    </div>
                                    <span>Last: date</span>
                                </div>
                            </CardContent>
                            <CardFooter >
                                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleViewMore(pool.id)}>
                                    View Details
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div> */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPools.map((pool) => (
                        <Card key={pool.id} className="overflow-hidden transition-shadow duration-300 hover:shadow-lg flex flex-col">
                            <CardHeader className="bg-secondary text-secondary-foreground ">
                                <div className="flex justify-between items-center ">
                                    <CardTitle className="text-2xl font-bold">{pool.name}</CardTitle>
                                    {/* <Badge variant={pool.status === 'Active' ? 'outline' : 'secondary'} className="text-xs px-2 py-1">
                                        {pool.status}
                                    </Badge> */}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 flex-1 bg-background">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-muted-foreground">Balance</span>
                                    <span className="text-2xl font-bold">${pool.balance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-sm font-medium text-muted-foreground">Performance</span>
                                    <div className={`flex items-center ${pool.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {pool.performance >= 0 ? <TrendingUp className="mr-1 h-5 w-5" /> : <TrendingDown className="mr-1 h-5 w-5" />}
                                        <span className="text-xl font-bold">{pool.performance >= 0 ? '+' : ''}{pool.performance}%</span>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Asset Allocation</span>
                                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        {pool.assets.map((asset) => (
                                            <div key={asset.symbol} className="flex items-center">
                                                <span className="w-12 text-sm font-medium text-foreground">{asset.symbol}</span>
                                                <Progress.Root
                                                    className="flex-grow mx-2 bg-gray-200 dark:bg-gray-800 relative h-4 overflow-hidden rounded-full"
                                                    value={asset.allocation}>
                                                    <Progress.Indicator
                                                        className="h-full w-full flex-1 transition-all bg-gray-800 dark:bg-gray-400"
                                                        style={{ transform: `translateX(-${100 - asset.allocation}%)` }}
                                                    />
                                                </Progress.Root>
                                                {/* <Progress value={asset.allocation} className="flex-grow mx-2" /> */}
                                                <span className="w-8 text-sm text-right">{asset.allocation}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <RefreshCcw className="mr-1 h-4 w-4" />
                                        <span>Rebalance at <span className='text-foreground font-bold'>{pool.rebalanceThreshold}%</span> drift</span>
                                    </div>
                                    <span>Last: 25/09/2024</span>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-background">
                                <Button className="w-full text-white bg-purple-600 hover:bg-purple-700" onClick={() => handleViewMore(pool.id)}>
                                    View Details
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {filteredPools.length === 0 && (
                    <div className="text-center mt-12">
                        <p className="text-xl text-gray-600">No pools found matching your search.</p>
                    </div>
                )}
            </div>
        </div >
    )
}
export default UserPoolsList;

