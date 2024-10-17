'use client';

import React, { useCallback, useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletModalProvider } from '@tronweb3/tronwallet-adapter-react-ui';
import { Adapter, WalletDisconnectedError, WalletError, WalletNotFoundError } from "@tronweb3/tronwallet-abstract-adapter";
import { toast } from 'react-hot-toast';
import { useEffect, useState } from "react";
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapters";
import SwitchChainPopup from '@/components/SwitchChainPopup';



export default function Providers({ children }: { children: React.ReactNode }) {

    function onError(e: WalletError) {
        if (e instanceof WalletNotFoundError) {
            toast.error(e.message);
        } else if (e instanceof WalletDisconnectedError) {
            toast.error(e.message);
        } else toast.error(e.message);
    }
    const [adapters, setAdapters] = useState<Adapter[]>([]);

    const adapter = useMemo(() => new TronLinkAdapter(), []);

    useEffect(() => {
        import('@tronweb3/tronwallet-adapters').then((res) => {
            const {

                TronLinkAdapter,
            } = res;
            const tronLinkAdapter = new TronLinkAdapter();
            setAdapters([tronLinkAdapter])
        });
    }, [setAdapters])


    const [currentChain, setCurrentChain] = useState<string>('');
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false); // Popup state
    const targetChainId = '0xcd8690dc'; // Target chain ID


    const checkAndSwitchChain = useCallback(async () => {
        if (adapter.connected) {
            const network = await adapter.network();
            console.log(network)
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
            console.log(adapter)
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
            setIsPopupVisible(false); // Close the popup on successful switch
        } catch (error) {
            console.error('Error in switching chainId', error);
        }
    }, [adapter, targetChainId]);

    useEffect(() => {
        if (currentChain && currentChain !== targetChainId) {
            setIsPopupVisible(true); // Show popup if not on the target chain
        } else {
            setIsPopupVisible(false); // Hide popup if on the correct chain
        }
    }, [currentChain, targetChainId]);

    return (
        <WalletProvider onError={onError} adapters={adapters} disableAutoConnectOnLoad={true}>
            <WalletModalProvider>
                {isPopupVisible && (
                    <SwitchChainPopup
                        onSwitchChain={customSwitchChain}
                        currentChainId={currentChain}
                        // onClose={() => setIsPopupVisible(false)}
                        targetChainId={targetChainId}
                    />
                )}
                {children}
            </WalletModalProvider>
        </WalletProvider>
    );
}

