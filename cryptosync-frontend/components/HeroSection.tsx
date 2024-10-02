
import Link from 'next/link';


const HeroSection = () => {
    return (
        <section className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
            <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold mb-6">
                    Automate Your Portfolio with On-Chain Rebalancing
                </h1>
                <p className="text-xl mb-8">
                    Simplify crypto asset management with dynamic thresholds, take-profit, and stop-loss strategies. Manage your assets efficiently, minimize risks, and maximize growth.
                </p>
                <div className='flex gap-2'>
                    <Link
                        href="/create-pool"
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                    >
                        Create Your Pool
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                    >
                        User&apos;s Pool
                    </Link>
                    <Link
                        href="/pool/1"
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                    >
                        Single Pool
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
