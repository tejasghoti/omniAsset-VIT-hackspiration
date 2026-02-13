import algosdk from 'algosdk';
import { signSnapTxns } from './snap';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

// ABI Method Definitions
const ABI = {
    list_asset: new algosdk.ABIMethod({
        name: 'list_asset',
        args: [
            { type: 'asset', name: 'asset' },
            { type: 'uint64', name: 'price' },
            { type: 'account', name: 'creator' },
            { type: 'uint64', name: 'royalty' },
            { type: 'axfer', name: 'axfer' },
            { type: 'txn', name: 'mbr_pay' }
        ],
        returns: { type: 'void' }
    }),
    buy_asset: new algosdk.ABIMethod({
        name: 'buy_asset',
        args: [
            { type: 'asset', name: 'asset' },
            { type: 'txn', name: 'payment' }
        ],
        returns: { type: 'void' }
    }),
    cancel_listing: new algosdk.ABIMethod({
        name: 'cancel_listing',
        args: [
            { type: 'asset', name: 'asset' }
        ],
        returns: { type: 'void' }
    })
};

// Helper: Custom Signer for Snap / WalletConnect
const createCustomSigner = (activeAddr: string, snapSender?: string | null, standardSigner?: any) => {
    return async (unsignedTxns: algosdk.Transaction[]) => {
        if (snapSender && activeAddr === snapSender) {
            // Sign with Snap
            const txnsB64 = unsignedTxns.map(t => Buffer.from(t.toByte()).toString('base64'));
            const signed64 = await signSnapTxns(txnsB64);
            if (!signed64) throw new Error("Snap signing failed");
            // @ts-ignore
            return signed64.map(s => new Uint8Array(Buffer.from(s, 'base64')));
        } else {
            // Standard Wallet Signer
            return standardSigner(unsignedTxns);
        }
    };
};

/**
 * List an Asset on the Marketplace
 */
export async function listAsset(
    client: algosdk.Algodv2,
    sender: string,
    appId: number,
    assetId: number,
    price: number,
    creatorAddr: string,
    royaltyBps: number,
    signer: any,
    snapSender?: string | null
) {
    const params = await client.getTransactionParams().do();
    const appAddr = algosdk.getApplicationAddress(appId);
    const customSigner = createCustomSigner(sender, snapSender, signer);

    const atc = new algosdk.AtomicTransactionComposer();

    // 1. Asset Transfer (Deposit to Contract)
    const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender,
        receiver: appAddr,
        assetIndex: assetId,
        amount: 1,
        suggestedParams: params
    });

    // 2. MBR Payment (Cover storage cost)
    // 0.1 (OptIn) + 0.0025 (Base) + 0.0004 * (8 + 80) = ~0.1377 ALGO
    // Let's send 0.2 ALGO to be safe, contract rejects excess? 
    // No, logic checks `mbr_pay.amount >= required`. 
    // Better to calculate exactly or send safe amount.
    const mbrAmount = 200_000; // 0.2 ALGO
    const mbrPay = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender,
        receiver: appAddr,
        amount: mbrAmount,
        suggestedParams: params
    });

    atc.addMethodCall({
        appID: appId,
        method: ABI.list_asset,
        methodArgs: [
            assetId,
            price,
            creatorAddr,
            royaltyBps,
            { txn: axfer, signer: customSigner },
            { txn: mbrPay, signer: customSigner }
        ],
        sender,
        suggestedParams: params,
        signer: customSigner,
        // methodArgs 'asset' type handles foreignAssets automatically
    });

    const result = await atc.execute(client, 4);
    return result.txIDs[0];
}

/**
 * Buy an Asset
 */
export async function buyAssetAtomic(
    client: algosdk.Algodv2,
    buyerAddr: string,
    assetId: number,
    price: number,
    appId: number,
    signer: any,
    snapSender?: string | null
) {
    const params = await client.getTransactionParams().do();
    const appAddr = algosdk.getApplicationAddress(appId);
    const customSigner = createCustomSigner(buyerAddr, snapSender, signer);

    const atc = new algosdk.AtomicTransactionComposer();

    // Payment to Contract
    const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: buyerAddr,
        receiver: appAddr,
        amount: price,
        suggestedParams: params
    });

    atc.addMethodCall({
        appID: appId,
        method: ABI.buy_asset,
        methodArgs: [
            assetId,
            { txn: payTxn, signer: customSigner }
        ],
        sender: buyerAddr,
        suggestedParams: params,
        signer: customSigner
    });

    const result = await atc.execute(client, 4);
    return result.txIDs[0];
}

/**
 * Cancel a Listing
 */
export async function cancelListing(
    client: algosdk.Algodv2,
    sender: string,
    appId: number,
    assetId: number,
    signer: any,
    snapSender?: string | null
) {
    const params = await client.getTransactionParams().do();
    const customSigner = createCustomSigner(sender, snapSender, signer);

    const atc = new algosdk.AtomicTransactionComposer();

    atc.addMethodCall({
        appID: appId,
        method: ABI.cancel_listing,
        methodArgs: [assetId],
        sender,
        suggestedParams: params,
        signer: customSigner
    });

    const result = await atc.execute(client, 4);
    return result.txIDs[0];
}
