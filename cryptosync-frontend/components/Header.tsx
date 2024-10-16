'use client'
import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import dynamic from 'next/dynamic'
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { usePathname } from 'next/navigation';
// import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer';
import { Button } from './ui/button';

const ConnectWallet = dynamic(() => import("@/components/ConnectWallet"), { ssr: false })

export function Header() {
    const { address } = useWallet();
    const pathname = usePathname();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
        const isActive = pathname === href
        return (
            <Link
                href={href}
                className={`px-4 py-2 ${isActive
                    ? 'border-accent'
                    : 'hover:border-accent'
                    } text-primary border-b-2 border-transparent transition-all duration-300 ease-in-out`}
            >
                {children}
            </Link>
        )
    }
    return (
        <header className="bg-background/80 sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur overflow-x-hidden overflow-y-auto">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link className="flex items-center space-x-2" href="/">
                        <span className="text-xl font-bold">
                            CryptoSync
                        </span>
                    </Link>

                    {!isDesktop ?
                        <Drawer direction='right'>
                            <DrawerTrigger className="p-2 text-foreground md:hidden">

                                <Menu size={24} />

                            </DrawerTrigger>
                            <DrawerContent >
                                <DrawerHeader>
                                    <DrawerTitle>
                                        <div className="flex h-16 items-center justify-between">
                                            <Link className="flex items-center space-x-2" href="/">
                                                <span className="text-xl font-bold">
                                                    CryptoSync
                                                </span>
                                            </Link>
                                            <div>
                                                <DrawerClose className="p-2 text-foreground md:hidden">

                                                    <X size={24} />

                                                </DrawerClose>

                                            </div>
                                        </div>
                                    </DrawerTitle>
                                </DrawerHeader>

                                <div className="flex flex-col max-w-max h-full mx-auto">
                                    <nav className="flex flex-col space-y-4 mb-4 text-center font-semibold text-lg">
                                        {address ? (
                                            <>
                                                <NavLink href="/create-pool">Create Pool</NavLink>
                                                <NavLink href="/dashboard">Dashboard</NavLink>
                                                <NavLink href="/faucet">Faucet</NavLink>
                                            </>
                                        ) : null}
                                    </nav>
                                    <div className="flex items-center justify-center gap-2">
                                        <ConnectWallet />
                                        <ModeToggle />
                                    </div>
                                </div>

                                <DrawerFooter>
                                    <DrawerClose>
                                        <Button variant="outline">Close</Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer> :
                        <nav className="hidden md:flex md:items-center md:space-x-6">
                            {address ? (
                                <>
                                    <NavLink href="/create-pool">Create Pool</NavLink>
                                    <NavLink href="/dashboard">Dashboard</NavLink>
                                    <NavLink href="/faucet">Faucet</NavLink>
                                </>
                            ) : null}
                            <ConnectWallet />
                            <ModeToggle />
                        </nav>
                    }


                </div>
            </div>



        </header>
    );
}
