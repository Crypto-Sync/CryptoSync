import dynamic from "next/dynamic";


const SinglePool = dynamic(() => import("@/components/SinglePool"), { ssr: false })
export default async function page() {
    return (
        <div className="py-20 min-h-screen flex flex-col items-center justify-center">

            <SinglePool />
        </div>
    );
}