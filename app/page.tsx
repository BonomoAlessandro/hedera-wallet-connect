'use client'

import {DAppConnector, HederaChainId, HederaJsonRpcMethod, HederaSessionEvent} from "@hashgraph/hedera-wallet-connect";
import {useEffect, useState} from "react";
import {SessionTypes} from "@walletconnect/types";
import {LedgerId, PrivateKey, TokenUpdateTransaction, Transaction} from "@hashgraph/sdk";

export default function Home() {

    // INFO: Private Key testnet wallet => ae094bb14c3367f4ec2b9553f6b0d275816a0bb057cbfd69c46e7405e8dc3092

    const metadata = {
        name: 'Hedera Integration using Hedera DAppConnector - v1 approach',
        description: 'Hedera dAppConnector Example',
        url: '',
        icons: ['https://avatars.githubusercontent.com/u/31002956'],
    }

    const [dAppConnector, setDAppConnector] = useState<DAppConnector>();
    const [session, setSession] = useState<SessionTypes.Struct>();

    const [manuallySignedTransactionHex, setManuallySignedTransactionHex] = useState<string>();
    const [walletSignedTransactionHex, setWalletSignedTransactionHex] = useState<string>();

    useEffect(() => {
        if (!dAppConnector) {
            const connector = new DAppConnector(
                metadata,
                LedgerId.TESTNET,
                "ebd13bdb8866bc09bfe3c4832ed1363d",
                Object.values(HederaJsonRpcMethod),
                [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
                [HederaChainId.Mainnet, HederaChainId.Testnet],
            )

            setDAppConnector(connector);
        }
    }, []);

    const connectWallet = async () => {
        if (!dAppConnector) {
            console.error('No dAppConnector available');
            return;
        }

        await dAppConnector.init({ logger: 'error' });
        await dAppConnector.disconnectAll();

        const walletSession = await dAppConnector.openModal()
        if (walletSession) {
            setSession(walletSession);
        }
    };

    const signTransactionManually = async (transactionHex: string) => {
        const signingKey = PrivateKey.fromStringED25519("ae094bb14c3367f4ec2b9553f6b0d275816a0bb057cbfd69c46e7405e8dc3092");

        const transactionBytes = Buffer.from(transactionHex, 'hex');
        const transaction = TokenUpdateTransaction.fromBytes(transactionBytes) as TokenUpdateTransaction;
        const signedTransaction = await transaction.sign(signingKey);
        const signedBytes = signedTransaction.toBytes();
        return Buffer.from(signedBytes).toString('hex');
    }

    const signTransactionHederaWalletConnect = async (transactionHex: string) => {
        if (!session) {
            console.error('No wallet session available');
            return;
        }
        if (!dAppConnector) {
            console.error('No dAppConnector available');
            return;
        }

        const transactionBytes = Buffer.from(transactionHex, 'hex');
        const transaction = TokenUpdateTransaction.fromBytes(transactionBytes) as TokenUpdateTransaction;

        const params = {
            signerAccountId: session.namespaces?.hedera?.accounts?.[0],
            transactionBody: transaction
        }
        const signedTransaction = await dAppConnector.signTransaction(params)

        if (signedTransaction instanceof Transaction) {
            const signedTransactionBytes = signedTransaction.toBytes();
            return Buffer.from(signedTransactionBytes).toString('hex')
        }
    }

    const signTransaction = async () => {
        const transactionHex = "0a682a660a620a1b0a0c08e6d6d2c40610daacefc802120908001000188ba3e30218001206080010001805188084af5f220208783200a2022f0a090800100018abeb8d032a221220bf7e8c87be6c3dca12afe9790491543004e29116be95c6b14ce42ac73ff1a93c1200";

        const manuallySignedTransactionHex = await signTransactionManually(transactionHex)
        const hederaWalletConnectSignedTransactionHex = await signTransactionHederaWalletConnect(transactionHex)

        setManuallySignedTransactionHex(manuallySignedTransactionHex);
        setWalletSignedTransactionHex(hederaWalletConnectSignedTransactionHex);

        console.log(manuallySignedTransactionHex);
        console.log(hederaWalletConnectSignedTransactionHex);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <button
                    onClick={async () => {
                        await connectWallet();
                    }}
                    className="!block !w-full border"
                >Connect Wallet</button>

                <button
                    onClick={async () => {
                        await signTransaction();
                    }}
                    className="!block !w-full border"
                >Sign Transaction</button>
            </div>

            <div className="flex flex-col gap-2">
                <div>Manually Signed Transaction Hex: {manuallySignedTransactionHex}</div>
                <div>Hedera Wallet Connect Signed Transaction Hex: {walletSignedTransactionHex}</div>
            </div>
        </div>

    );
}
