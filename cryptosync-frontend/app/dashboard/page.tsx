
import dynamic from "next/dynamic";

const UserPoolsList = dynamic(() => import("@/components/UserPoolsList"), { ssr: false })

export default async function page() {

    return (
        <div className="py-10 min-h-screen flex items-center justify-center">
            <UserPoolsList />
        </div>
    );
}
