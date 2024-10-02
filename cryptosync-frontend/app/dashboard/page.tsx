import { CryptoPrices, fetchCryptoPrices } from "@/lib/fetchCryptoPrices";
import dynamic from "next/dynamic";

const UserPoolsList = dynamic(() => import("@/components/UserPoolsList"), { ssr: false })
export default async function page() {
    const prices: CryptoPrices = await fetchCryptoPrices();
    return (
        <div className="py-20 min-h-screen flex items-center justify-center bg-gray-800">
            <UserPoolsList prices={prices} />
        </div>
    );
}
