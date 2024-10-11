'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    WalletActionButton,
} from '@tronweb3/tronwallet-adapter-react-ui';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';


export default function ConnectWallet() {
    const adapter = useMemo(() => new TronLinkAdapter(), []);

    const [hasAttemptedSwitch, setHasAttemptedSwitch] = useState(false);
    const targetChainId = "0xcd8690dc"; // The chain ID you want to switch to

    const checkAndSwitchChain = useCallback(async () => {
        if (!hasAttemptedSwitch && adapter.connected) {
            setHasAttemptedSwitch(true);
            try {
                await adapter.switchChain(targetChainId);
                console.log('Switched to target chain:', targetChainId);
            } catch (error) {
                // Reset the attempt flag if the switch failed (e.g., user rejected)
                setHasAttemptedSwitch(false);
            }
        }
    }, [adapter, targetChainId, hasAttemptedSwitch]);

    useEffect(() => {
        if (!hasAttemptedSwitch) {
            console.log("calledddddddddddddddddddddddd")
            checkAndSwitchChain()
        }
        return () => {
            setHasAttemptedSwitch(false)
        }
    }, [checkAndSwitchChain, hasAttemptedSwitch])

    return (
        <>
            <UIComponent />
        </>
    );
}

function UIComponent() {
    return (
        <div>
            <WalletActionButton />
        </div>
    );
}