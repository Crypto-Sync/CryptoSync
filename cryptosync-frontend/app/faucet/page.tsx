// import Faucet from "@/components/Faucet";

// pages/faucet.tsx
import dynamic from "next/dynamic";

const Faucet = dynamic(() => import("@/components/Faucet"), { ssr: false });

export default function FaucetPage() {
    return (
        <div className="py-10 min-h-screen flex items-center justify-center">
            <Faucet />
        </div>
    );
}
