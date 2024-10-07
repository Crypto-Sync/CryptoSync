'use client'
import React from 'react';
// import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
    WalletActionButton,
} from '@tronweb3/tronwallet-adapter-react-ui';

export default function ConnectWallet() {
    return (<>
        <UIComponent></UIComponent>
        {/* <Profile></Profile> */}

    </>)
}
function UIComponent() {
    return (
        <div>
            <WalletActionButton />
        </div>
    );
}

// function Profile() {
//     const { address, connected, wallet } = useWallet();
//     return (
//         <div>
//             <h2>Wallet Connection Info</h2>
//             <p>
//                 <span>Connection Status:</span> {connected ? 'Connected' : 'Disconnected'}
//             </p>
//             <p>
//                 <span>Your selected Wallet:</span> {wallet?.adapter.name}
//             </p>
//             <p>
//                 <span>Your Address:</span> {address}
//             </p>
//         </div>
//     );
// }

