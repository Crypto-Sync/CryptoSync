import { CryptoPrices, fetchCryptoPrices } from "@/lib/fetchCryptoPrices";
import dynamic from "next/dynamic";

const SinglePool = dynamic(() => import("@/components/SinglePool"), { ssr: false })
export default async function page() {
    const prices: CryptoPrices = await fetchCryptoPrices();
    return (
        <div className="py-20 min-h-screen flex items-center justify-center bg-gray-800">
            <SinglePool prices={prices} />
        </div>
    );
}