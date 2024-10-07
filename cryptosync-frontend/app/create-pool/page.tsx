import { CryptoPrices, fetchCryptoPrices } from "@/lib/fetchCryptoPrices";
import dynamic from "next/dynamic";

const CreatePool = dynamic(() => import("@/components/CreatePool"), { ssr: false })
import mongoose from "mongoose";

function checkMongoConnection() {
    const status = mongoose.connection.readyState;

    switch (status) {
    case 0:
        console.log("MongoDB is disconnected.");
        break;
    case 1:
        console.log("MongoDB is connected.");
        break;
    case 2:
        console.log("MongoDB is connecting...");
        break;
    case 3:
        console.log("MongoDB is disconnecting...");
        break;
    default:
        console.log("Unknown connection state:", status);
    }
}

export default async function page() {
    checkMongoConnection()
    // const prices: CryptoPrices = await fetchCryptoPrices();
    return (
        <div className="bg-background py-20 min-h-screen flex items-center justify-center">
            <CreatePool />
        </div>
    );
}
