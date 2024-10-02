
import { CryptoPrices, fetchCryptoPrices } from "@/lib/fetchCryptoPrices";
import dynamic from "next/dynamic";

const UpdatePool = dynamic(() => import("@/components/UpdatePool"), { ssr: false })

export default async function page() {
    const prices: CryptoPrices = await fetchCryptoPrices();
    return (
        <div className="py-20 min-h-screen flex items-center justify-center bg-gray-900">
            <UpdatePool prices={prices} />
        </div>
    );
}
