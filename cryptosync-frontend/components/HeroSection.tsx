
import Link from 'next/link';


const HeroSection = () => {
    return (
        <section className="flex flex-col items-center justify-center h-screen">
            <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold mb-6 text-primary">
                    Automate Your Portfolio with On-Chain Rebalancing
                </h1>
                <p className="text-xl mb-8 text-secondary-foreground">
                    Simplify crypto asset management with dynamic thresholds, take-profit, and stop-loss strategies. Manage your assets efficiently, minimize risks, and maximize growth.
                </p>
                <div className='flex gap-2 items-center justify-center'>
                    <Link
                        href="/create-pool"
                        className="px-8 py-4 bg-accent hover:bg-black text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                    >
                        Create Your Pool
                    </Link>

                </div>
            </div>
        </section>
    );
};

export default HeroSection;
