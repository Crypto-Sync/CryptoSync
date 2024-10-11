'use client'
import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import dynamic from 'next/dynamic'
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

const ConnectWallet = dynamic(() => import("@/components/ConnectWallet"), { ssr: false })

export function Header() {
    const { address } = useWallet();
    return (
        <header className="bg-transparent sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4  md:flex ">
                    <Link className="mr-6 flex items-center space-x-2" href="/">
                        <span className=" font-bold sm:inline-block">
                            CryptoSync
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <nav className="flex items-center gap-3">
                        {address ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 bg-accent hover:bg-black text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/faucet"
                                    className="px-4 py-2 bg-accent hover:bg-black text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                                >
                                    Faucet
                                </Link>
                            </>
                        ) : null}
                        <ConnectWallet />
                        <ModeToggle />
                    </nav>
                </div>
            </div>
        </header>
    );
}
