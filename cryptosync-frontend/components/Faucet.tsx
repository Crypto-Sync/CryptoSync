'use client'

import { useEffect, useState } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { parseEther, formatEther } from 'viem';
import { abi } from "../abis/Token.json";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tronWeb, setTronWeb] = useState<any>(null);
    const { address } = useWallet();
    const [status, setStatus] = useState<string | null>(null);
    const [balances, setBalances] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [statusVisible, setStatusVisible] = useState(false);

    useEffect(() => {
        const initTronWeb = async () => {
            if (typeof window !== 'undefined' && window.tronWeb) {
                const tronInstance = window.tronWeb;
                if (tronInstance?.defaultAddress?.base58) {
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

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (status) {
            setStatusVisible(true);
            timeoutId = setTimeout(() => {
                setStatusVisible(false);
                setTimeout(() => setStatus(null), 300);
            }, 5000);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [status]);

    useEffect(() => {
        if (address && tronWeb) {
            fetchAllBalances();
        }
    }, [address, tronWeb]);

    const fetchBalance = async (tokenKey: string) => {
        const token = tokens[tokenKey];
        try {
            const contract = await tronWeb.contract(abi, token.address);
            const balance = await contract.methods.balanceOf(address).call();
            return formatEther(balance.toString());
        } catch (error) {
            console.error(`Error fetching ${tokenKey} balance:`, error);
            return '0';
        }
    };

    const fetchAllBalances = async () => {
        const newBalances: { [key: string]: string } = {};
        for (const tokenKey of Object.keys(tokens)) {
            newBalances[tokenKey] = await fetchBalance(tokenKey);
        }
        setBalances(newBalances);
    };

    const mintTokens = async (tokenKey: string) => {
        if (!address) {
            setStatus('Please connect your wallet');
            return;
        }

        setLoading(prev => ({ ...prev, [tokenKey]: true }));
        const token = tokens[tokenKey];

        try {
            const contract = await tronWeb.contract(abi, token.address);
            const mintAmount = parseEther("100");

            await contract.methods.mintMore(address, mintAmount).send({
                from: address,
                feeLimit: 1000 * 1e6,
            });

            setStatus(`${token.name} minted successfully!`);
            // Update balance after minting
            const newBalance = await fetchBalance(tokenKey);
            setBalances(prev => ({ ...prev, [tokenKey]: newBalance }));
        } catch (error) {
            console.error('Error minting tokens:', error);
            setStatus('Error minting tokens. Please try again.');
        } finally {
            setLoading(prev => ({ ...prev, [tokenKey]: false }));
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Faucet</h2>
            <p className="mb-4 text-center text-gray-800 dark:text-gray-300">
                Click to mint your test tokens:
            </p>
            <div className="space-y-4">
                {Object.entries(tokens).map(([key, token]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{token.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Balance: {balances[key] || '0'}
                            </p>
                        </div>
                        <button
                            onClick={() => mintTokens(key)}
                            disabled={loading[key]}
                            className={`px-4 py-2 rounded-lg shadow ${key === 'SyncX' ? 'bg-blue-600 hover:bg-blue-700' :
                                key === 'SyncY' ? 'bg-green-600 hover:bg-green-700' :
                                    'bg-red-600 hover:bg-red-700'
                                } text-white ${loading[key] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading[key] ? 'Minting...' : `Mint ${token.name}`}
                        </button>
                    </div>
                ))}
            </div>
            {status && (
                <div
                    className={`mt-4 p-3 rounded transition-all duration-300 ${statusVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                        } ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}
                >
                    {status}
                </div>
            )}
        </div>
    );
};

export default Faucet;
