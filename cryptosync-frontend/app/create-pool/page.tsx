import dynamic from "next/dynamic";

const CreatePool = dynamic(() => import("@/components/CreatePool"), { ssr: false })




export default async function page() {

    // const prices: CryptoPrices = await fetchCryptoPrices();
    return (
        <div className="bg-background py-20 min-h-screen flex items-center justify-center">
            <CreatePool />
        </div>
    );
}
