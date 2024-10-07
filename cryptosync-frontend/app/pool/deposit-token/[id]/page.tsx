import { CryptoPrices, fetchCryptoPrices } from "@/lib/fetchCryptoPrices";
import dynamic from "next/dynamic";

const DepositMoreTokens = dynamic(() => import("@/components/DepositMoreToken"), { ssr: false })

export default async function page() {
    const prices: CryptoPrices = await fetchCryptoPrices();
    return (
        <div className="py-20 min-h-screen flex items-center justify-center">
            <DepositMoreTokens prices={prices} />
        </div>
    );
}