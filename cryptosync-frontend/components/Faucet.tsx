'use client'

import { useEffect, useState } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { parseEther } from 'viem';

const faucetAbi = [
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "mintMore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];


const tokens: { [key: string]: { address: string; name: string } } = {
    SyncX: {
        address: "TWYiT6zVWEH8gkp14YSPTyTjt8MXNbvVud",
        name: 'SyncX'
    },
    SyncY: {
        address: "TUQJvMCiPfaYLDyQg8cKkK64JSkUVZh4qq",
        name: 'SyncY'
    },
    SyncZ: {
        address: "TRjfuFK3hZvx2nDhNM1khy1t15G8xb21Us",
        name: 'SyncZ'
    }
};

const Faucet: React.FC = () => {

    const [tronWeb, setTronWeb] = useState<any>(null);

    const { address } = useWallet(); // Assuming you're using the TronWallet adapter hooks to connect
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        const initTronWeb = async () => {
            if (typeof window !== 'undefined' && window.tronWeb) {
                const tronInstance = window.tronWeb;

                // Check if defaultAddress and base58 exist
                const defaultAddress = tronInstance?.defaultAddress?.base58;

                if (defaultAddress) {
                    setTronWeb(tronInstance);

                } else {
                    console.error('No default address found in TronLink.');
                }
            } else {
                console.error('TronLink is not installed or not logged in.');
            }
        };

        initTronWeb();
    }, []);




    const mintTokens = async (tokenKey: string) => {
        const token = tokens[tokenKey];
        console.log(token);
        try {
            if (!address) {
                setStatus('Please connect your wallet');
                return;
            }

            const contract = await tronWeb.contract(faucetAbi, token.address);
            const mintAmount = parseEther("100"); // Mint 1000 tokens

            await contract.methods.mintMore(address, mintAmount).send({
                from: address,
                feeLimit: 1000 * 1e6,
                // callValue: 0, // No TRX to send with this call
            });

            setStatus(`${token.name} minted successfully!`);
        } catch (error) {
            console.error('Error minting tokens:', error);
            // setStatus('Error minting tokens: ' + error.message);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 w-full max-w-lg flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Faucet</h2>
            <p className="mb-4 text-gray-800 dark:text-gray-300">
                Click to mint your test tokens (SyncX, SyncY, SyncZ):
            </p>
            <div className="flex space-x-4">
                <button
                    onClick={() => mintTokens('SyncX')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                    Mint SyncX
                </button>
                <button
                    onClick={() => mintTokens('SyncY')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                >
                    Mint SyncY
                </button>
                <button
                    onClick={() => mintTokens('SyncZ')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                >
                    Mint SyncZ
                </button>
            </div>
            {status && <p className="mt-4 text-red-500 dark:text-red-400">{status}</p>}
        </div>
    );
};

export default Faucet;
