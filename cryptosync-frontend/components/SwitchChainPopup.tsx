'use client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

interface PopupProps {
    onSwitchChain: () => void;
    // onClose: () => void;
    currentChainId: string;
    targetChainId: string;
}
interface ChainInfo {
    name: string
    chainId: string
}
const chainList: ChainInfo[] = [
    { name: "Tron Mainnet (TronGrid)", chainId: "0x2b6653dc" },
    { name: "Tron Shasta Testnet", chainId: "0x94a9059e" },
    { name: "Tron Nile Testnet", chainId: "0xcd8690dc" },
]

export default function SwitchChainPopup({ onSwitchChain, currentChainId, targetChainId }: PopupProps) {

    const getChainName = (chainId: string) => {
        const chain = chainList.find(c => c.chainId === chainId)
        return chain ? chain.name : "Unknown Network"
    }

    const currentChainName = getChainName(currentChainId)
    const targetChainName = getChainName(targetChainId)
    return (
        <div className="fixed inset-0 bg-background/80 dark:bg-background/80 backdrop-blur-sm flex justify-center items-center z-50">
            <Card className="w-[420px] shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold">Switch Tron Network</CardTitle>
                        {/* <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button> */}
                    </div>
                    <CardDescription>Please switch to the correct Tron network to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4 mb-4">
                        <div className="w-full p-3 bg-destructive/10 rounded-md">
                            <span className="text-sm font-medium text-destructive">Connected Network</span>
                            <div className="mt-1">
                                <div className="text-lg font-semibold">{currentChainName}</div>
                                <span className="text-xs text-muted-foreground">Chain ID: {currentChainId}</span>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <ArrowDown className="text-muted-foreground" />
                        </div>
                        <div className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                            <span className="text-sm font-medium text-primary">Required Network</span>
                            <div className="mt-1">
                                <div className="text-lg font-semibold">{targetChainName}</div>
                                <span className="text-xs text-muted-foreground">Chain ID: {targetChainId}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-accent/80 text-white hover:bg-accent hover:text-white" onClick={onSwitchChain}>
                        Switch to {targetChainName}
                    </Button>
                </CardFooter>
            </Card>
        </div >
    );
}