'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { WalletActionButton } from '@tronweb3/tronwallet-adapter-react-ui';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';

export default function ConnectWallet() {
    const adapter = useMemo(() => new TronLinkAdapter(), []);
    const [currentChain, setCurrentChain] = useState<string>('');
    const targetChainId = '0xcd8690dc'; // Target chain ID

    const checkAndSwitchChain = useCallback(async () => {
        if (adapter.connected) {
            const network = await adapter.network();
            setCurrentChain(network.chainId);
        }
    }, [adapter]);

    // Detect when chain ID changes in the wallet
    const handleNetworkChange = useCallback(
        (chainData: unknown) => {
            const newChainData = chainData as { chainId: string };
            console.log('Chain ID changed in wallet:', newChainData);
            setCurrentChain(newChainData?.chainId as string);
        },
        []
    );

    useEffect(() => {
        if (adapter) {
            checkAndSwitchChain(); // Initial chain check

            // Listen for network changes in the wallet
            adapter.on('chainChanged', handleNetworkChange);
        }

        // Cleanup event listener when component unmounts
        return () => {
            adapter.off('chainChanged', handleNetworkChange);
        };
    }, [adapter, checkAndSwitchChain, handleNetworkChange]);

    const customSwitchChain = useCallback(async () => {
        try {
            await adapter.switchChain(targetChainId);
            console.log('Switched to target chain:', targetChainId);
        } catch (error) {
            console.error('Error in switching chainId', error);
        }
    }, [adapter, targetChainId]);



    return (
        <>
            <UIComponent
                currentChain={currentChain}
                targetChainId={targetChainId}
                onSwitchChain={customSwitchChain}
            />

        </>
    );
}

interface UIComponentProps {
    currentChain: string;
    targetChainId: string;
    onSwitchChain: () => void;
}

function UIComponent({ currentChain, targetChainId, onSwitchChain }: UIComponentProps) {
    return (
        <div>
            {currentChain && currentChain !== targetChainId ? (
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center"
                    onClick={onSwitchChain}
                >
                    Wrong Chain
                </button>
            ) : (
                <WalletActionButton />
            )}
        </div>
    );
}

