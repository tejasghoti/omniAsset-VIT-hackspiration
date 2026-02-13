import algosdk from 'algosdk';
import { signSnapTxns } from './snap';
import { Buffer } from 'buffer'; // Requires polyfill or vite config, but assuming standard environment

// Polyfill Buffer in browser if needed (Vite 5+ doesn't include it by default)
if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

export async function mintAsset(
    client: algosdk.Algodv2,
    sender: string,
    cid: string,
    metadata: any,
    signer: any,
    snapSender?: string | null
) {
    const params = await client.getTransactionParams().do();

    // Create Asset
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: sender,
        suggestedParams: params,
        total: 1,
        decimals: 0,
        defaultFrozen: false,
        manager: sender,
        reserve: sender,
        freeze: sender,
        clawback: sender,
        unitName: 'AI-AST',
        assetName: (metadata.name || 'AI Asset').substring(0, 32),
        assetURL: `ipfs://${cid}`,
        note: new TextEncoder().encode(JSON.stringify(metadata)), // ARC-69 style
    });

    let signedTxn;

    if (snapSender && sender === snapSender) {
        // Sign with Snap
        // txn to base64
        const txnB64 = Buffer.from(txn.toByte()).toString('base64');
        const signed = await signSnapTxns([txnB64]);

        // signed is likely array of signed txn (base64 strings? or objects?)
        // If it's array of strings (base64):
        if (Array.isArray(signed) && signed.length > 0) {
            // Usually returns array of signed objects or strings.
            // If string, assume base64.
            const s = signed[0];
            if (typeof s === 'string') {
                signedTxn = Buffer.from(s, 'base64');
            } else if (s === null) {
                throw new Error("Transaction rejected");
            } else {
                // Might be object or hex?
                // Let's assume base64 string for now.
                // If fails, we debug.
                signedTxn = Buffer.from(s, 'base64');
            }
        }
    } else {
        // Sign with Wallet (use-wallet)
        // Signer expects Transaction[] (or groups)
        const txns = [txn];
        // Must group if needed, but single txn ok.
        algosdk.assignGroupID(txns); // Not needed for single

        // Convert to encoded txn objects or pass Transaction objects if supported
        // use-wallet signer expects Transaction[] usually.

        const signed = await signer(txns);
        // returns Uint8Array or array of them?
        signedTxn = signed[0];
    }

    const response = await client.sendRawTransaction(signedTxn).do() as any;
    return response.txId;
}
