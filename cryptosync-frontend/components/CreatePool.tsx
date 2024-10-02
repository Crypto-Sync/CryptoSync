"use client";

import { useEffect, useState } from 'react';
import * as Select from '@radix-ui/react-select'
// import * as SliderPrimitive from '@radix-ui/react-slider';
import { ChevronDown, Check, Info } from 'lucide-react';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { TooltipArrow } from '@radix-ui/react-tooltip';
import { CryptoPrices } from '@/lib/fetchCryptoPrices';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import * as Progress from '@radix-ui/react-progress';

// Type for each token
interface Token {
    id: string;
    name: string;
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
    { id: 'btc', name: 'BTC', fullName: 'Bitcoin', icon: "bitcoin.svg", color: 'bg-yellow-500', balance: 1.5 },
    { id: 'eth', name: 'ETH', fullName: 'Ethereum', icon: "eth-icon.svg", color: 'bg-blue-500', balance: 10 },
    { id: 'tron', name: 'TRON', fullName: 'Tron', icon: "trx-icon.svg", color: 'bg-blue-500', balance: 1000 },
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
    onPercentageChange: (tokenId: string, percentage: number, amount: number) => void;
    onTakeProfitChange: (tokenId: string, percentage: number) => void;
    onStopLossChange: (tokenId: string, percentage: number) => void;
    takeProfit: number;
    stopLoss: number;
    prices?: CryptoPrices
}

function TokenSlider({ token, onPercentageChange, onTakeProfitChange, onStopLossChange, takeProfit, stopLoss, prices }: TokenSliderProps) {
    // const ethPriceInUSD: number = prices ? prices.eth : 0;
    // const [sliderValue, setSliderValue] = useState<number>(0);
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
    const tokenPrice = prices ? prices[token.id as keyof CryptoPrices] : null;

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
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full mb-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className={`border border-${token?.color} p-1 rounded-full mr-3`}>
                        <Image src={token?.icon} alt="token icon" className="w-8 h-8 text-white" width={100} height={100} />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{token?.name}</h3>
                        <p className="text-gray-400 text-sm">{token?.fullName}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-white font-semibold">{token?.balance.toFixed(4)}</p>
                    <p className="text-gray-400 text-sm">Balance</p>
                </div>
            </div>

            {/* <div className="mb-6 flex items-center">
                <SliderPrimitive.Root
                    value={[sliderValue]}
                    max={100}
                    step={0.1}
                    orientation="horizontal"
                    className="relative flex items-center select-none touch-none w-full h-5"
                    onValueChange={(e) => handleSliderChange(e)}
                >
                    <SliderPrimitive.Track className="bg-gray-700 relative grow rounded-full h-[3px]">
                        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                    </SliderPrimitive.Track>
                    <SliderPrimitive.Thumb className="block w-5 h-5 bg-white rounded-full shadow-lg border-2 border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-30" />
                </SliderPrimitive.Root>

                <div className="rounded-lg pl-3 flex justify-between items-center">
                    <input
                        type="number"
                        value={sliderValue.toFixed(2)}
                        onChange={handleInputChange}
                        className="w-16 text-white bg-gray-700 rounded-md p-1 text-lg text-right focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                        min="0"
                        max="100"
                        step="1"
                    />
                </div>
            </div> */}

            <div className="flex flex-col justify-between text-sm mb-2 mt-4">
                <span className="text-gray-400 mb-2">Enter Amount<span className='text-gray-500 text-sm ml-2'>({token?.name})</span></span>
                <div className='flex items-center justify-center gap-2'>
                    <input
                        type="number"
                        value={selectedAmount}
                        onChange={handleInputAmountChange}
                        className="px-3 py-2 flex-1 text-white bg-gray-700 rounded-md p-1 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                        min={0}
                        max={token?.balance}
                        step={0.01}
                    />
                </div>
            </div>

            <div className="flex justify-start items-center text-sm">
                <span className="text-white font-medium text-lg">
                    {/* {remainingBalance.toFixed(4)} {token?.name} */}
                    <span className='text-gray-500 mr-1 text-sm'>$</span>{tokenPrice ? (tokenPrice * selectedAmount).toFixed(4) : 0}
                </span>
            </div>



            <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`takeProfit-${token.id}`} className="flex items-center text-sm font-medium text-gray-400 mb-1">
                        Take Profit (%)
                        <InfoTooltip content="The percentage increase at which to sell for profit" />
                    </label>
                    <input
                        type="number"
                        id={`takeProfit-${token.id}`}
                        value={takeProfit}
                        onChange={handleTakeProfitChange}
                        min="0"
                        max="1000"
                        step="0.1"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    />
                </div>
                <div>
                    <label htmlFor={`stopLoss-${token.id}`} className="flex items-center text-sm font-medium text-gray-400 mb-1">
                        Stop Loss (%)
                        <InfoTooltip content="The percentage decrease at which to sell to limit losses" />
                    </label>
                    <input
                        type="number"
                        id={`stopLoss-${token.id}`}
                        value={stopLoss}
                        onChange={handleStopLossChange}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
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
                <button className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    Select Token
                    <ChevronDown className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
                <DropdownMenuContent className="mt-2 w-56 rounded-md bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {tokens.filter(token => !currentTokens.includes(token.id)).map((token) => (
                        <DropdownMenuItem
                            key={token.id}
                            className="text-gray-300 hover:bg-gray-600 hover:text-white group flex items-center px-4 py-2 text-sm cursor-pointer"
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
            <Select.Trigger className="w-full inline-flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500">
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
interface UserPoolsListProps {
    prices: CryptoPrices;
}
export default function CreatePool({ prices }: UserPoolsListProps) {
    console.log(prices)
    const [poolName, setPoolName] = useState<string>('');
    const [selectedTokens, setSelectedTokens] = useState<string[]>(['btc', 'eth']);
    const [tokenPercentages, setTokenPercentages] = useState<Record<string, number>>({ "btc": 0, "eth": 0 });
    const [tokenAmounts, setTokenAmounts] = useState<Record<string, number>>({});
    const [takeProfitPercentages, setTakeProfitPercentages] = useState<Record<string, number>>({})
    const [stopLossPercentages, setStopLossPercentages] = useState<Record<string, number>>({})
    const [rebalancingThreshold, setRebalancingThreshold] = useState<number>(10);
    const [rebalancingFrequency, setRebalancingFrequency] = useState<string>('');
    const [tokenValues, setTokenValues] = useState<{ [key: string]: number }>({})
    const [totalValue, setTotalValue] = useState(0)

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
        const values: { [key: string]: number } = {}
        let total = 0

        selectedTokens.forEach((tokenId) => {
            const amount = tokenAmounts[tokenId] || 0
            const price = prices[tokenId as keyof CryptoPrices] || 0
            const value = amount * price
            values[tokenId] = value
            total += value
        })

        setTokenValues(values)
        setTotalValue(total)
    }, [selectedTokens, tokenAmounts, prices])

    const handleCreatePool = () => {
        const tokenProportions = selectedTokens.map(tokenId => {
            const value = tokenValues[tokenId] || 0;
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
            return {
                tokenId,
                name: tokens.find(t => t.id === tokenId)?.name,
                value: value,
                percentage: percentage,
                amount: tokenAmounts[tokenId] || '0.0000',
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
    };

    return (
        <div className="bg-gray-900 p-6 rounded-xl shadow-custom-strong max-w-3xl w-full">
            <h1 className="text-3xl font-bold text-white mb-8 mt-4 text-center">Create Pool</h1>

            <div className="mb-6">
                <label htmlFor="poolName" className="flex items-center text-sm font-medium text-gray-400 mb-2">
                    Pool Name
                    <InfoTooltip content="Enter a unique name for your pool" />
                </label>
                <input
                    type="text"
                    id="poolName"
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            token={tokens.find((t) => t.id === tokenId)!} // Assert non-null with !
                            onPercentageChange={handlePercentageChange}
                            onTakeProfitChange={handleTakeProfitChange}
                            onStopLossChange={handleStopLossChange}
                            takeProfit={takeProfitPercentages[tokenId] || 0}
                            stopLoss={stopLossPercentages[tokenId] || 0}
                            prices={prices}
                        />
                    </div>
                ))}
            </div>

            <Card className="bg-gray-800 mb-6 border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-normal text-white">Token Proportion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {selectedTokens.map((tokenId) => {
                        const token = tokens.find((t) => t.id === tokenId);
                        const value = tokenValues[tokenId] || 0;
                        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

                        return (
                            <div key={tokenId} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">{token?.name}</span>
                                    <span className="text-white">
                                        ${value.toFixed(2)} ({percentage.toFixed(2)}%)
                                    </span>
                                </div>
                                {/* <Progress value={percentage} className="h-2" /> */}
                                {/* <Progress value={percentage} className="flex-grow mx-2 h-2 bg-black rounded-full" /> */}

                                <Progress.Root
                                    className="flex-grow mx-2 bg-gray-700 relative h-4 w-full overflow-hidden rounded-full"
                                    value={percentage}>
                                    <Progress.Indicator
                                        className="h-full w-full flex-1 transition-all bg-gray-200"
                                        style={{ transform: `translateX(-${100 - percentage}%)` }}
                                    />
                                </Progress.Root>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">
                                        {tokenAmounts[tokenId]?.toFixed(4) || '0.0000'} {token?.name}
                                    </span>
                                    <div className="space-x-4">
                                        <span className="text-green-400">
                                            Take Profit: {takeProfitPercentages[tokenId] || 0}%
                                        </span>
                                        <span className="text-red-400">
                                            Stop Loss: {stopLossPercentages[tokenId] || 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-white">Total Value</span>
                            <span className="text-lg font-bold text-white">${totalValue.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mb-6 flex gap-4 flex-col md:flex-row">
                <div className='flex-1'>
                    <label htmlFor="rebalancingThreshold" className="flex items-center text-sm font-medium text-gray-400 mb-2">
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
                        className="w-full px-3 py-3 bg-gray-800 text-white leading-5 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
