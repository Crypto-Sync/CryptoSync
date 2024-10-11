"use client";

import { useCallback, useEffect, useState } from 'react';
import * as Select from '@radix-ui/react-select'
// import * as SliderPrimitive from '@radix-ui/react-slider';
import { ChevronDown, Check, Info } from 'lucide-react';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { TooltipArrow } from '@radix-ui/react-tooltip';
// import { CryptoPrices } from '@/lib/fetchCryptoPrices';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import * as Progress from '@radix-ui/react-progress';
import { formatEther, parseEther } from 'viem'
import { abi, contractAddress } from '../abis/PoolFactory.json'

// Type for each token
interface Token {
    id: string;
    name: string;
    tokenAddress: string;
    fullName: string;
    icon: string;
    color: string;
    balance: number;
}

// Type for each rebalancing option
interface RebalancingOption {
    value: string;
    label: string;
}

// List of tokens
const tokens: Token[] = [
    { id: 'syx', name: 'SYX', tokenAddress: "TWYiT6zVWEH8gkp14YSPTyTjt8MXNbvVud", fullName: 'SyncX', icon: "trx-icon.svg", color: 'bg-yellow-500', balance: 1000 },
    { id: 'syy', name: 'SYY', tokenAddress: "TUQJvMCiPfaYLDyQg8cKkK64JSkUVZh4qq", fullName: 'SyncY', icon: "trx-icon.svg", color: 'bg-blue-500', balance: 1000 },
    { id: 'syz', name: 'SYZ', tokenAddress: "TRjfuFK3hZvx2nDhNM1khy1t15G8xb21Us", fullName: 'SyncZ', icon: "trx-icon.svg", color: 'bg-blue-500', balance: 1000 },
];

// Rebalancing options
const rebalancingOptions: RebalancingOption[] = [
    { value: '1hour', label: '1 hour' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

// TokenSlider component props
interface TokenSliderProps {
    token: Token;
    tokenBalance: number;
    onPercentageChange: (tokenId: string, percentage: number, amount: number) => void;
    onTakeProfitChange: (tokenId: string, percentage: number) => void;
    onStopLossChange: (tokenId: string, percentage: number) => void;
    takeProfit: number;
    stopLoss: number;
    tokenPrice: number;
}

function TokenSlider({ token, tokenPrice, tokenBalance, onPercentageChange, onTakeProfitChange, onStopLossChange, takeProfit, stopLoss }: TokenSliderProps) {



    // const ethPriceInUSD: number = prices ? prices.eth : 0;
    // const [sliderValue, setSliderValue] = useState<number>(0);

    console.log('tokenPrices in slider', tokenPrice);
    const [selectedAmount, setSelectedAmount] = useState<number>(0);
    // const remainingBalance = token?.balance - selectedAmount;

    // const handleSliderChange = (value: number[]) => {
    //     onPercentageChange(token.id, value[0], (value[0] / 100) * token.balance);
    //     setSliderValue(value[0]);
    // };

    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const inputValue = parseFloat(e.target.value);
    //     if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 100) {
    //         setSliderValue(inputValue);
    //         onPercentageChange(token.id, inputValue, (inputValue / 100) * token.balance);
    //     }
    // };

    const handleTakeProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value)
        onTakeProfitChange(token.id, value)
    }

    const handleStopLossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value)
        onStopLossChange(token.id, value)
    }

    const handleInputAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = parseFloat(e.target.value);

        if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= token.balance) {
            setSelectedAmount(inputValue)
            const percentage = (inputValue / token.balance) * 100;
            // setSliderValue(percentage);
            onPercentageChange(token.id, percentage, inputValue);
        }
    };

    return (
        <div className="bg-zinc-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full mb-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className={`border border-gray-500 dark:border-gray-200 p-1 rounded-full mr-3`}>
                        <Image src={token?.icon} alt="token icon" className="w-8 h-8 text-foreground" width={100} height={100} />
                    </div>
                    <div>
                        <h3 className="text-forground font-semibold">{token?.name}</h3>
                        <p className="text-muted-foreground text-sm">{token?.fullName}</p>
                    </div>
                </div>
                <div className="text-right">
                    {/* <p className="text-forground font-semibold">{token?.balance.toFixed(4)}</p> */}
                    <p className="text-forground font-semibold">{tokenBalance.toFixed(4)}</p>
                    <p className="text-muted-foreground text-sm">Balance</p>
                </div>
            </div>
            <div className="flex flex-col justify-between text-sm mb-2 mt-4">
                <span className="text-primary font-semibold mb-2">Enter Amount<span className='text-muted-foreground text-sm ml-2'>({token?.name})</span></span>
                <div className='flex items-center justify-center gap-2'>
                    <input
                        type="number"
                        value={selectedAmount}
                        onChange={handleInputAmountChange}
                        className="px-3 py-2 flex-1 text-foreground bg-gray-300 dark:bg-gray-700 rounded-md p-1 text-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                        min={0}
                        max={token?.balance}
                        step={0.01}
                    />
                </div>
            </div>

            <div className="flex justify-start items-center text-sm">
                <span className="text-foreground font-medium text-lg">
                    {/* {remainingBalance.toFixed(4)} {token?.name} */}
                    <span className='text-muted-foreground mr-1 text-sm'>$</span>{tokenPrice ? (tokenPrice * selectedAmount).toFixed(4) : 0}
                </span>
            </div>



            <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`takeProfit-${token.id}`} className="flex items-center text-sm font-medium text-secondary-foreground mb-1">
                        Take Profit (%)
                        <InfoTooltip content="The percentage increase at which to sell for profit" />
                    </label>
                    <input
                        type="number"
                        id={`takeProfit-${token.id}`}
                        value={takeProfit}
                        onChange={handleTakeProfitChange}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 bg-gray-300 dark:bg-gray-700 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    />
                </div>
                <div>
                    <label htmlFor={`stopLoss-${token.id}`} className="flex items-center text-sm font-medium text-secondary-foreground mb-1">
                        Stop Loss (in USD)
                        <InfoTooltip content="At this price all your tokens will be sold out for handle loss" />
                    </label>
                    <input
                        type="number"
                        id={`stopLoss-${token.id}`}
                        value={stopLoss}
                        onChange={handleStopLossChange}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 bg-gray-300 dark:bg-gray-700 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    />
                </div>
            </div>
        </div>
    );
}

// TokenSelector component props
interface TokenSelectorProps {
    currentTokens: string[];
    onTokenChange: (newTokenId: string) => void;
}

function TokenSelector({ currentTokens, onTokenChange }: TokenSelectorProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-secondary-foreground bg-gray-300 dark:bg-gray-700 rounded-md hover:bg-input focus:outline-none focus:ring-2 focus:ring-ring">
                    Select Token
                    <ChevronDown className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
                <DropdownMenuContent className="mt-2 w-56 rounded-md text-foreground bg-gray-300 dark:bg-gray-800 shadow-lg ring-1 ring-primary ring-opacity-5 focus:outline-none">
                    {tokens.filter(token => !currentTokens.includes(token.id)).map((token) => (
                        <DropdownMenuItem
                            key={token.id}
                            className="text-foreground bg-gray-700 hover:bg-gray-700 group flex items-center px-4 py-2 text-sm cursor-pointer"
                            onSelect={() => onTokenChange(token.id)}
                        >
                            <Image src={token.icon} alt="token icon" className="mr-3 h-5 w-5" aria-hidden="true" width={100} height={100} />
                            {token.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}

// RebalancingFrequencySelect component props
interface RebalancingFrequencySelectProps {
    value: string;
    onChange: (value: string) => void;
}

function RebalancingFrequencySelect({ value, onChange }: RebalancingFrequencySelectProps) {
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger className="w-full inline-flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-primary bg-input focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500">
                <Select.Value placeholder="Select frequency" />
                <Select.Icon>
                    <ChevronDown className="ml-2 -mr-1 h-5 w-5" />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className="overflow-hidden bg-gray-700 rounded-md shadow-lg">
                    <Select.Viewport className="p-1">
                        {rebalancingOptions.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                className="relative flex items-center px-8 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white cursor-pointer"
                            >
                                <Select.ItemText>{option.label}</Select.ItemText>
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                    <Check className="h-4 w-4" />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    )
}

// InfoTooltip component props
interface InfoTooltipProps {
    content: string;
}

function InfoTooltip({ content }: InfoTooltipProps) {
    return (

        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button className="ml-1 text-gray-400 hover:text-gray-300 focus:outline-none focus:text-gray-300">
                        <Info className="h-4 w-4" />
                    </button>
                </TooltipTrigger>

                <TooltipContent
                    className="bg-gray-700 text-white text-sm rounded-md px-4 py-2 max-w-xs"
                    sideOffset={5}
                >
                    {content}
                    <TooltipArrow className="fill-gray-700" />
                </TooltipContent>

            </Tooltip>
        </TooltipProvider>
    );
}



export default function CreatePool() {
    // console.log(prices);
    const [poolName, setPoolName] = useState<string>('');
    const [selectedTokens, setSelectedTokens] = useState<string[]>(['syx', 'syy']);
    const [tokenPercentages, setTokenPercentages] = useState<Record<string, number>>({ "syx": 0, "syy": 0 });
    const [tokenAmounts, setTokenAmounts] = useState<Record<string, number>>({});
    const [takeProfitPercentages, setTakeProfitPercentages] = useState<Record<string, number>>({})
    const [stopLossPercentages, setStopLossPercentages] = useState<Record<string, number>>({})
    const [rebalancingThreshold, setRebalancingThreshold] = useState<number>(10);
    const [rebalancingFrequency, setRebalancingFrequency] = useState<string>('');
    const [tokenValues, setTokenValues] = useState<{ [key: string]: number }>({})
    const [totalValue, setTotalValue] = useState(0)
    const [tokenPrices, setTokenPrices] = useState<{ [key: string]: number }>({});
    const [tokenBalances, setTokenBalances] = useState<{ [key: string]: number }>({});


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tronWeb, setTronWeb] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [factoryContract, setFactoryContract] = useState<any>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);

    const handleTokenChange = (index: number, newTokenId: string) => {
        setSelectedTokens((prev) => {
            const newTokens = [...prev];
            const previousTokenId = newTokens[index];

            // Update the selected token
            newTokens[index] = newTokenId;

            // Remove the previous token's percentage and amount if it's no longer selected
            if (previousTokenId && !newTokens.includes(previousTokenId)) {
                setTokenPercentages((prev) => {
                    const newPercentages = { ...prev };
                    delete newPercentages[previousTokenId]; // Remove the percentage of the previous token
                    return newPercentages;
                });

                setTokenAmounts((prev) => {
                    const newAmounts = { ...prev };
                    delete newAmounts[previousTokenId]; // Remove the amount of the previous token
                    return newAmounts;
                });
            }

            return newTokens;
        });
        console.log(selectedTokens);
        console.log(tokenAmounts);
        console.log(tokenPercentages);
    };

    const handlePercentageChange = (tokenId: string, percentage: number, amount: number) => {
        setTokenPercentages((prev) => ({
            ...prev,
            [tokenId]: percentage,
        }));
        setTokenAmounts((prev) => ({
            ...prev,
            [tokenId]: amount,
        }));
    };

    const handleTakeProfitChange = (tokenId: string, percentage: number) => {
        setTakeProfitPercentages(prev => ({
            ...prev,
            [tokenId]: percentage
        }))
    }

    const handleStopLossChange = (tokenId: string, percentage: number) => {
        setStopLossPercentages(prev => ({
            ...prev,
            [tokenId]: percentage
        }))
    }

    useEffect(() => {
        const initFactory = async () => {
            if (tronWeb && userAddress) { // Ensure both are available before calling
                try {
                    const factoryContractInstance = await tronWeb.contract(abi, contractAddress);
                    setFactoryContract(factoryContractInstance); // Set the factory contract
                    console.log('Factory contract initialized:', factoryContractInstance);
                } catch (error) {
                    console.error('Error initializing factory contract:', error);
                }
            }
        };

        // Only initialize factory if tronWeb and userAddress are set
        if (tronWeb && userAddress) {
            initFactory();
        }
    }, [tronWeb, userAddress]);


    const fetchTokenBalances = async (
        selectedTokens: string[],
        tokens: Token[],
        userAddress: string
    ) => {
        const balances: { [key: string]: number } = {};

        // Fetch balances for all selected tokens in parallel
        await Promise.all(
            selectedTokens.map(async (tokenId) => {
                const token = tokens.find((t) => t.id === tokenId);
                if (token) {
                    try {
                        const tokenContract = await tronWeb.contract().at(token.tokenAddress);
                        const balanceRaw = await tokenContract.balanceOf(userAddress).call();
                        const balance = parseInt(balanceRaw, 10) / 10 ** 18; // Convert from Sun to actual token value
                        balances[tokenId] = balance;
                        console.log(`Balance for ${token.name}:`, balance);
                    } catch (error) {
                        console.error(`Error fetching balance for ${token.name}:`, error);
                        balances[tokenId] = 0; // Default to 0 if there's an error
                    }
                }
            })
        );

        return balances;
    };

    const handleFetchBalances = useCallback(async () => {
        if (tronWeb && userAddress && selectedTokens.length > 0) {
            const balances = await fetchTokenBalances(selectedTokens, tokens, userAddress);
            setTokenBalances(balances); // Update the state with fetched balances
        }
    }, [tronWeb, userAddress, selectedTokens]);

    // Trigger the fetch function when dependencies change
    useEffect(() => {
        handleFetchBalances();
    }, [handleFetchBalances]);


    useEffect(() => {
        const fetchPricesAndCalculate = async () => {
            const values: { [key: string]: number } = {};
            let total = 0;

            // Fetch prices for each selected token
            const pricesArray = await Promise.all(
                selectedTokens.map(async (tokenId) => {
                    const token = tokens.find((t) => t.id === tokenId);
                    if (token && factoryContract) {
                        try {
                            const priceRaw = await factoryContract.getOnChainPrice(token.tokenAddress).call();
                            const price = parseInt(priceRaw, 10) / 10 ** 6; // Convert the price to an integer and conver to normal form
                            console.log(`Price for ${token.name}:`, price);
                            return { tokenId, price };
                        } catch (error) {
                            console.error(`Error fetching price for ${token.name}:`, error);
                            return { tokenId, price: 0 }; // Default price if fetching fails
                        }
                    }
                    console.log("pricessss")
                    console.log('prices in funnn', prices);

                    return { tokenId, price: 0 };
                })
            );

            // Calculate values using the fetched prices
            const prices = pricesArray.reduce((acc, { tokenId, price }) => {
                acc[tokenId] = price;
                return acc;
            }, {} as { [key: string]: number });

            selectedTokens.forEach((tokenId) => {
                const amount = tokenAmounts[tokenId] || 0;
                const tokenPriceData = pricesArray.find((p) => p.tokenId === tokenId);
                const price = tokenPriceData ? tokenPriceData.price : 0;
                const value = amount * price;
                values[tokenId] = value;
                total += value;
            });

            console.log("prices after setting", prices);
            setTokenPrices(prices);
            setTokenValues(values);
            setTotalValue(total);
        };

        if (selectedTokens.length > 0 && factoryContract) {
            fetchPricesAndCalculate();
        }
    }, [selectedTokens, tokenAmounts, factoryContract]);

    useEffect(() => {
        const initTronWeb = async () => {
            if (typeof window !== 'undefined' && window.tronWeb) {
                const tronInstance = window.tronWeb;

                // Check if defaultAddress and base58 exist
                const defaultAddress = tronInstance?.defaultAddress?.base58;

                if (defaultAddress) {
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


    interface CreatePoolData {
        poolAddress: string | null;
        userWalletAddress: string;
        poolName: string;
        totalValue: number | null;
        tokens: Array<{ symbol: string | undefined; amount: number | string; proportion: number }>;
        rebalancingThreshold: number;
        rebalancingFrequency: string;
        takeProfitPercentage?: number;
        stopLossPercentage?: number;
    }


    async function createPool(data: CreatePoolData) {

        console.log("data", data);
        // 2.476285 =>total value
        const response = await fetch('/api/pools/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log(result);
    }

    const handleCreatePool = async () => {
        const tokenProportions = selectedTokens.map(tokenId => {
            const value = tokenValues[tokenId] || 0;
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
            return {
                tokenId,
                name: tokens.find(t => t.id === tokenId)?.name,
                value: value,
                tokenAddress: tokens.find(t => t.id === tokenId)?.tokenAddress,
                percentage: percentage.toFixed(2),
                amount: (tokenAmounts[tokenId] || 0),
                takeProfit: takeProfitPercentages[tokenId] || 0,
                stopLoss: stopLossPercentages[tokenId] || 0
            };
        });

        console.log('Creating pool:', {
            poolName,
            totalValue: totalValue,
            tokenProportions,
            rebalancingThreshold,
            rebalancingFrequency,
        });

        if (!tronWeb || !userAddress) {
            console.error('TronWeb is not initialized or no user is connected');
            return;
        }

        // const factoryContract = await tronWeb.contract(abi, contractAddress);

        let rebalancingInterval: string;
        console.log("rebalancingFrequency.toLowerCase()", rebalancingFrequency.toLowerCase());
        switch (rebalancingFrequency.toLowerCase()) {
            case 'daily':
                rebalancingInterval = (86400).toString();
                break;
            case 'weekly':
                rebalancingInterval = (604800).toString();
                break;
            case '1hour':
                rebalancingInterval = (3600).toString();
                break;
            case 'monthly':
                rebalancingInterval = (265200).toString();
                break;
            default:
                throw new Error('Unsupported rebalancing frequency');
        }


        const params = [
            [tokenProportions[0].tokenAddress, tokenProportions[1].tokenAddress],
            [parseEther(tokenProportions[0].amount.toString()).toString(), parseEther(tokenProportions[1].amount.toString()).toString()],
            [(parseFloat(tokenProportions[0].percentage) * 100).toFixed(0), (parseFloat(tokenProportions[1].percentage) * 100).toFixed(0)],
            (rebalancingThreshold * 100).toString(),
            [tokenProportions[0].takeProfit * 100, tokenProportions[1].takeProfit * 100],
            [tokenProportions[0].stopLoss * 10 ** 6, tokenProportions[1].stopLoss * 10 ** 6],
            rebalancingInterval
        ];


        try {

            // Trigger token approvals (user must approve tokens before pool creation)
            for (let i = 0; i < params[0].length; i++) {
                const tokenAddress = params[0][i];  // Get the current token address
                const tokenContract = await tronWeb.contract().at(tokenAddress);

                // Fetch the allowance of the user for the current token
                const allowance = await tokenContract.allowance(userAddress, contractAddress).call();

                // Convert allowance to a number for comparison
                const allowanceInNumber = Number(formatEther(allowance));
                console.log(`allowance of token ${i}`, allowanceInNumber);

                const requiredAmount = parseFloat((tokenProportions[i].amount).toString());
                console.log(`requiredAmount of token ${i}`, requiredAmount);

                // Check if the allowance is less than the required amount
                if (allowanceInNumber < requiredAmount) {
                    console.log(`Allowance is less than required. Approving max allowance for token: ${tokenAddress}`);

                    // Approve max allowance if allowance is not enough
                    await tokenContract.approve(
                        contractAddress,
                        '115792089237316195423570985008687907853269984665640564039457584007913129639935' // Max approval
                    ).send({
                        from: userAddress
                    });

                    console.log(`Max allowance approved for token: ${tokenAddress}`);
                } else {
                    console.log(`Sufficient allowance already set for token: ${tokenAddress}`);
                }
            }

            console.log('userAddress', userAddress);
            console.log('params in contract', params);
            // Now create the pool
            const tx = await factoryContract.createPool(params).send({
                feeLimit: 1000 * 1e6, // Transaction fee limit
                callValue: 0, // No TRX to send with this call
                from: userAddress // User pays gas
            });
            console.log(tx)

        } catch (error) {
            console.error('Error creating pool:', error);
        }
        const getPoolAddress = async () => {
            try {

                const poolAddresses = await factoryContract.getPoolsByUser(userAddress).call();

                const base58Addresses: string[] = poolAddresses.map((addr: string) => tronWeb.address.fromHex(addr));

                if (base58Addresses.length > 0) {
                    return base58Addresses[poolAddresses.length - 1]; // Get the latest pool address
                } else {
                    throw new Error('No pools found for this user.');
                }
            } catch (error) {
                return null;
            }
        }


        const poolAddress = await getPoolAddress();
        console.log(poolAddress);

        createPool({
            poolAddress,//need to change this becasue it is stroing hash of address
            userWalletAddress: userAddress,
            poolName: poolName,
            totalValue: totalValue,
            tokens: [
                { symbol: tokenProportions[0].name, amount: tokenProportions[0].amount, proportion: parseFloat(tokenProportions[0].percentage) },
                { symbol: tokenProportions[1].name, amount: tokenProportions[1].amount, proportion: parseFloat(tokenProportions[1].percentage) }
            ],
            rebalancingThreshold,
            rebalancingFrequency: rebalancingInterval,
            takeProfitPercentage: 30,
            stopLossPercentage: 5
        });

    };

    return (
        <div className="bg-background p-6 rounded-xl shadow-custom-strong max-w-3xl w-full">
            <h1 className="text-3xl font-bold text-foreground mb-8 mt-4 text-center">Create Pool</h1>
            <div className="mb-6">
                <label htmlFor="poolName" className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                    Pool Name
                    <InfoTooltip content="Enter a unique name for your pool" />
                </label>
                <input
                    type="text"
                    id="poolName"
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                    className="w-full px-3 py-2 bg-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter pool name"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                {selectedTokens.map((tokenId, index) => (
                    <div key={tokenId} className="flex flex-col gap-4">
                        <TokenSelector
                            currentTokens={selectedTokens}
                            onTokenChange={(newTokenId) => handleTokenChange(index, newTokenId)}
                        />
                        <TokenSlider
                            token={tokens.find((t) => t.id === tokenId)!}
                            onPercentageChange={handlePercentageChange}
                            onTakeProfitChange={handleTakeProfitChange}
                            onStopLossChange={handleStopLossChange}
                            takeProfit={takeProfitPercentages[tokenId] || 0}
                            stopLoss={stopLossPercentages[tokenId] || 0}
                            tokenPrice={tokenPrices[tokenId]}
                            tokenBalance={tokenBalances[tokenId] || 0} // Pass the real token balance
                        />
                    </div>
                ))}
            </div>

            <Card className="bg-gray-100 shadow-lg dark:bg-gray-800 mb-6 border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-normal text-foreground">Pool Proportion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {selectedTokens.map((tokenId) => {
                        const token = tokens.find((t) => t.id === tokenId);
                        const value = tokenValues[tokenId] || 0;
                        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

                        return (
                            <div key={tokenId} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-foreground">{token?.name}</span>
                                    <span className="text-primary font-medium">
                                        ${value.toFixed(2)} ({percentage.toFixed(2)}%)
                                    </span>
                                </div>
                                <Progress.Root
                                    className="flex-grow mx-2 bg-gray-300 dark:bg-gray-700 relative h-4 overflow-hidden rounded-full"
                                    value={percentage}>
                                    <Progress.Indicator
                                        className="h-full w-full flex-1 transition-all bg-gray-800 dark:bg-gray-200"
                                        style={{ transform: `translateX(-${100 - percentage}%)` }}
                                    />
                                </Progress.Root>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary-foreground">
                                        {tokenAmounts[tokenId]?.toFixed(4) || '0.0000'} {token?.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-foreground">Total Value</span>
                            <span className="text-lg font-bold text-foreground">${totalValue.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mb-6 flex gap-4 flex-col md:flex-row">
                <div className='flex-1'>
                    <label htmlFor="rebalancingThreshold" className="flex items-center text-sm font-medium text-foreground mb-2">
                        Rebalancing Threshold (%)
                        <InfoTooltip content="The percentage deviation that triggers a rebalance" />
                    </label>
                    <input
                        type="number"
                        id="rebalancingThreshold"
                        value={rebalancingThreshold}
                        onChange={(e) => setRebalancingThreshold(Number(e.target.value))}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-3 text-foreground bg-input leading-5 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div className="mb-6 flex-1">
                    <label htmlFor="rebalancingFrequency" className="flex items-center text-sm font-medium text-gray-400 mb-2">
                        Rebalancing Frequency
                        <InfoTooltip content="How often the pool should check for rebalancing" />
                    </label>
                    <RebalancingFrequencySelect
                        value={rebalancingFrequency}
                        onChange={setRebalancingFrequency}
                    />
                </div>
            </div>
            <button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                onClick={() => handleCreatePool()}
            >
                Create Pool
            </button>
        </div>
    );
}
