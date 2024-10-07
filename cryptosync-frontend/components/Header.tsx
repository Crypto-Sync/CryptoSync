
import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import ConnectWallet from './ConnectWallet'

export function Header() {
    return (
        <header className="bg-transparent sticky top-0 z-50 w-full border-b border-border/40  backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 hidden md:flex">
                    <Link className="mr-6 flex items-center space-x-2" href="/">
                        <span className="hidden font-bold sm:inline-block">
                            CryptoSync
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                    </div>
                    <nav className="flex items-center gap-4">
                        <ModeToggle />
                        <ConnectWallet />
                    </nav>
                </div>
            </div>
        </header>
    )
}